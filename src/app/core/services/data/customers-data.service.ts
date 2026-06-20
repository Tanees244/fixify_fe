import { Injectable, Injector, inject } from '@angular/core';
import {
  AddCustomerPayload,
  Customer,
  OnboardCustomerPayload,
} from '../../models/fixify.models';
import { cloneMockData, MOCK_CUSTOMERS } from '../../data/mock-data';
import { mapApiClientToCustomer } from '../../utils/api-mappers.util';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { AuthService } from '../auth.service';
import { EntityIdRegistry } from '../entity-id-registry.service';
import { ClientsApiService } from '../api/clients-api.service';
import { DataSessionService } from './data-session.service';
import { SubscriptionsDataService } from './subscriptions-data.service';
import { SitesDataService } from './sites-data.service';

@Injectable({ providedIn: 'root' })
export class CustomersDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly auth = inject(AuthService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly injector = inject(Injector);

  readonly customers: Customer[] = [];

  private nextCustomerId = 100;

  loadMockCustomers(): void {
    this.customers.splice(0, this.customers.length, ...cloneMockData(MOCK_CUSTOMERS));
  }

  clientApiIdFor(localCustomerId: number): string | undefined {
    return (
      this.ids.clientApiId(localCustomerId) ??
      this.customers.find((c) => c.id === localCustomerId)?.apiId
    );
  }

  getCustomer(id: number): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  pendingApprovals(): Customer[] {
    return this.customers.filter((c) => c.approvalStatus === 'pending');
  }

  customersOnPlan(planId: string): number {
    return this.customers.filter((c) => c.plan === planId).length;
  }

  applyAuthCustomerProfile(user: {
    clientProfileId?: string;
    name: string;
    email: string;
  }): void {
    if (!user.clientProfileId) return;
    const customer = mapApiClientToCustomer(
      {
        _id: user.clientProfileId,
        companyName: user.name,
        user: { email: user.email, name: user.name },
        status: 'active',
      },
      this.ids
    );
    this.customers.splice(0, this.customers.length, customer);
    this.ctx.currentCustomerId.set(customer.id);
  }

  fetchClients(done?: () => void): void {
    if (!this.session.useApi()) {
      this.loadMockCustomers();
      this.session.bump();
      done?.();
      return;
    }
    this.session.beginLoad();
    this.clientsApi.getClients({ limit: 200 }).subscribe({
      next: (res) => {
        this.customers.splice(
          0,
          this.customers.length,
          ...(res.data?.clients ?? []).map((c) => mapApiClientToCustomer(c, this.ids))
        );
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load customers');
        done?.();
      },
    });
  }

  addCustomer(data: AddCustomerPayload): void {
    if (this.session.useApi()) {
      this.clientsApi
        .createClient({
          clientName: data.company || data.name,
          email: data.email,
          whatsappNumber: data.phone || '',
          address: data.company,
        })
        .subscribe({
          next: (res) => {
            const profile = (res.data?.clientProfile ?? res.data) as Record<string, unknown>;
            const customer = mapApiClientToCustomer(profile, this.ids);
            customer.approvalStatus = data.requireApproval ? 'pending' : 'approved';
            customer.status = data.requireApproval ? 'pending' : 'active';
            customer.plan = data.plan || 'free';
            this.customers.push(customer);
            this.toast.success(
              data.requireApproval ? `${data.name} submitted for approval` : `Customer ${data.name} onboarded`
            );
            this.ctx.closeModal();
          },
          error: (err) => this.toast.error(err?.error?.message || 'Failed to create customer'),
        });
      return;
    }

    this.addCustomerLocal(data);
  }

  private addCustomerLocal(data: AddCustomerPayload): void {
    const requireApproval = data.requireApproval ?? false;
    const customer: Customer = {
      id: this.nextCustomerId++,
      name: data.name,
      email: data.email,
      company: data.company || data.name,
      plan: data.plan || 'free',
      status: requireApproval ? 'pending' : 'active',
      approvalStatus: requireApproval ? 'pending' : 'approved',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatar: data.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      phone: data.phone || '',
    };
    this.customers.push(customer);
    const msg = requireApproval
      ? `${data.name} submitted for approval`
      : `Customer ${data.name} onboarded`;
    this.toast.success(msg);
    this.ctx.closeModal();
  }

  onboardCustomer(data: OnboardCustomerPayload): void {
    if (this.session.useApi()) {
      this.clientsApi
        .createClient({
          clientName: data.company || data.name,
          email: data.email,
          whatsappNumber: data.phone || '',
          address: data.company,
        })
        .subscribe({
          next: (res) => {
            const profile = (res.data?.clientProfile ?? res.data) as Record<string, unknown>;
            const customer = mapApiClientToCustomer(profile, this.ids);
            customer.approvalStatus = data.requireApproval ? 'pending' : 'approved';
            customer.status = data.requireApproval ? 'pending' : 'active';
            customer.plan = data.plan || 'free';
            this.customers.push(customer);
            this.sites().addSiteForCustomer(customer.id, data.site, { silent: true });
            this.toast.success(
              data.requireApproval
                ? `${data.name} submitted for approval with WordPress site`
                : `${data.name} onboarded with WordPress site`
            );
          },
          error: (err) => this.toast.error(err?.error?.message || 'Failed to onboard customer'),
        });
      return;
    }

    this.onboardCustomerLocal(data);
  }

  private onboardCustomerLocal(data: OnboardCustomerPayload): void {
    const requireApproval = data.requireApproval ?? false;
    const customer: Customer = {
      id: this.nextCustomerId++,
      name: data.name,
      email: data.email,
      company: data.company || data.name,
      plan: data.plan || 'free',
      status: requireApproval ? 'pending' : 'active',
      approvalStatus: requireApproval ? 'pending' : 'approved',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatar: data.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      phone: data.phone || '',
    };
    this.customers.push(customer);
    this.sites().addSiteForCustomer(customer.id, data.site, { silent: true });
    const msg = requireApproval
      ? `${data.name} submitted for approval with WordPress site`
      : `${data.name} onboarded with WordPress site`;
    this.toast.success(msg);
  }

  approveCustomer(id: number): void {
    if (this.session.useApi()) {
      const apiId = this.clientApiIdFor(id);
      if (apiId) {
        this.clientsApi.activateClient(apiId).subscribe({
          next: () => this.approveCustomerLocal(id),
          error: (err) => this.toast.error(err?.error?.message || 'Failed to activate customer'),
        });
        return;
      }
    }
    this.approveCustomerLocal(id);
  }

  private approveCustomerLocal(id: number): void {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx < 0) return;
    this.customers[idx] = {
      ...this.customers[idx],
      approvalStatus: 'approved',
      status: 'active',
    };
    this.toast.success(`${this.customers[idx].name} approved and activated`);
  }

  rejectCustomer(id: number): void {
    if (this.session.useApi()) {
      const apiId = this.clientApiIdFor(id);
      if (apiId) {
        this.clientsApi.deactivateClient(apiId).subscribe({
          next: () => this.rejectCustomerLocal(id),
          error: (err) => this.toast.error(err?.error?.message || 'Failed to deactivate customer'),
        });
        return;
      }
    }
    this.rejectCustomerLocal(id);
  }

  private rejectCustomerLocal(id: number): void {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx < 0) return;
    this.customers[idx] = {
      ...this.customers[idx],
      approvalStatus: 'rejected',
      status: 'rejected',
    };
    this.toast.info(`${this.customers[idx].name} onboarding rejected`);
  }

  assignSubscription(customerId: number, plan: string): void {
    const idx = this.customers.findIndex((c) => c.id === customerId);
    if (idx < 0) return;
    this.customers[idx] = { ...this.customers[idx], plan };
    this.toast.success(`Subscription updated to ${this.subscriptions().planLabel(plan)}`);
  }

  updateCustomer(updated: Customer): void {
    const idx = this.customers.findIndex((c) => c.id === updated.id);
    if (idx >= 0) this.customers[idx] = { ...updated };
    this.toast.success(`${updated.name} updated`);
    this.ctx.closeModal();
  }

  private sites(): SitesDataService {
    return this.injector.get(SitesDataService);
  }

  private subscriptions(): SubscriptionsDataService {
    return this.injector.get(SubscriptionsDataService);
  }
}
