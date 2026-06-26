import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppContextService } from '../../../core/services/app-context.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CustomersDataService,
  InsightsDataService,
  SitesDataService,
  SubscriptionsDataService,
  TicketsDataService,
} from '../../../core/services/data';
import { SubscriptionPlanModalComponent } from '../../../features/modals/subscription-plan-modal/subscription-plan-modal.component';
import {
  AddCustomerPayload,
  AddSitePayload,
  CreateProcessPayload,
  CreateTicketPayload,
  Customer,
  ModalState,
  SubscriptionPlan,
  SubscriptionPlanPayload,
} from '../../../core/models/fixify.models';
import { AddSiteModalComponent } from '../../../features/modals/add-site-modal/add-site-modal.component';
import { AddCustomerModalComponent } from '../../../features/modals/add-customer-modal/add-customer-modal.component';
import { EditCustomerModalComponent } from '../../../features/modals/edit-customer-modal/edit-customer-modal.component';
import { ViewCustomerModalComponent } from '../../../features/modals/view-customer-modal/view-customer-modal.component';
import { CreateTicketModalComponent } from '../../../features/modals/create-ticket-modal/create-ticket-modal.component';
import { ConfirmModalComponent } from '../../../features/modals/confirm-modal/confirm-modal.component';
import { CreateProcessModalComponent } from '../../../features/modals/create-process-modal/create-process-modal.component';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  imports: [
    AddSiteModalComponent,
    AddCustomerModalComponent,
    EditCustomerModalComponent,
    ViewCustomerModalComponent,
    CreateTicketModalComponent,
    ConfirmModalComponent,
    CreateProcessModalComponent,
    SubscriptionPlanModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modal(); as m) {
      <div [class]="ui.overlay" role="presentation" (click)="close()">
        <div [class]="modalClass(m)" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          @switch (m.type) {
            @case ('addSite') {
              <app-add-site-modal (closed)="close()" (submitted)="onAddSite($event)" />
            }
            @case ('addCustomer') {
              <app-add-customer-modal (closed)="close()" (submitted)="onAddCustomer($event)" />
            }
            @case ('editCustomer') {
              <app-edit-customer-modal
                [customer]="asCustomer(m.data)"
                (closed)="close()"
                (submitted)="onEditCustomer($event, m)"
              />
            }
            @case ('viewCustomer') {
              <app-view-customer-modal
                [customer]="asCustomer(m.data)"
                [sites]="sitesData.sites"
                [tickets]="ticketsData.tickets"
                (closed)="close()"
                (manage)="onManageCustomer($event, m)"
              />
            }
            @case ('createTicket') {
              <app-create-ticket-modal
                [sites]="ticketSites(m)"
                (closed)="close()"
                (submitted)="onCreateTicket($event)"
              />
            }
            @case ('confirm') {
              <app-confirm-modal
                [title]="m.title ?? 'Confirm'"
                [body]="m.body ?? ''"
                [danger]="m.danger ?? false"
                (closed)="close()"
                (confirmed)="onConfirm(m)"
              />
            }
            @case ('createProcess') {
              <app-create-process-modal
                [sites]="m.sites ?? sitesData.sites"
                (closed)="close()"
                (submitted)="onCreateProcess($event, m)"
              />
            }
            @case ('subscriptionPlan') {
              <app-subscription-plan-modal
                [plan]="asPlan(m.data)"
                [submitting]="subscriptionsData.planSaving()"
                (closed)="close()"
                (submitted)="onSubscriptionPlan($event, m)"
              />
            }
          }
        </div>
      </div>
    }
  `,
})
export class ModalHostComponent {
  protected readonly ctx = inject(AppContextService);
  protected readonly customersData = inject(CustomersDataService);
  protected readonly sitesData = inject(SitesDataService);
  protected readonly ticketsData = inject(TicketsDataService);
  protected readonly subscriptionsData = inject(SubscriptionsDataService);
  protected readonly insightsData = inject(InsightsDataService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly ui = tw;

  readonly modal = this.ctx.modal;

  constructor() {
    effect(() => {
      document.body.style.overflow = this.modal() ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modal()) {
      this.close();
    }
  }

  modalClass(m: ModalState): string {
    const large = m.type === 'viewCustomer';
    return large ? `${tw.modal} ${tw.modalLg}` : tw.modal;
  }

  close(): void {
    this.ctx.closeModal();
  }

  asCustomer(data: unknown): Customer {
    return data as Customer;
  }

  asPlan(data: unknown): SubscriptionPlan | null {
    return (data as SubscriptionPlan) ?? null;
  }

  ticketSites(m: ModalState) {
    return m.sites ?? this.sitesData.sites;
  }

  onAddSite(payload: AddSitePayload): void {
    if (payload.custId) {
      this.sitesData.addSiteForCustomer(payload.custId, payload, { closeModal: true });
    } else {
      this.sitesData.addSite(payload);
    }
  }

  onAddCustomer(payload: AddCustomerPayload): void {
    this.customersData.addCustomer(payload);
  }

  onEditCustomer(updated: Customer, m: ModalState): void {
    if (m.onSubmit) {
      m.onSubmit(updated);
      this.close();
    } else {
      this.customersData.updateCustomer(updated);
    }
  }

  onManageCustomer(customer: Customer, m: ModalState): void {
    this.close();
    if (m.onManage) {
      m.onManage(customer);
    } else {
      this.ctx.openModal({
        type: 'editCustomer',
        data: customer,
      });
    }
  }

  async onCreateTicket(payload: CreateTicketPayload): Promise<void> {
    const id = await this.ticketsData.createTicket(payload);
    if (!id) return;
    const role = this.auth.getCurrentUser()?.role === 'admin' ? 'admin' : 'customer';
    this.router.navigate([`/${role}/tickets`, id]);
  }

  onConfirm(m: ModalState): void {
    m.onConfirm?.();
    this.close();
  }

  onCreateProcess(payload: CreateProcessPayload, m: ModalState): void {
    if (m.onSubmit) {
      m.onSubmit(payload);
      this.close();
    } else {
      this.insightsData.createProcess(payload);
      this.close();
    }
  }

  onSubscriptionPlan(payload: SubscriptionPlanPayload, m: ModalState): void {
    const existing = m.data as SubscriptionPlan | undefined;
    if (existing?.id) {
      this.subscriptionsData.updateSubscriptionPlan(existing.id, payload);
    } else {
      this.subscriptionsData.createSubscriptionPlan(payload);
    }
  }
}
