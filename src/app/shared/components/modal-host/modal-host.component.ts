import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
} from '@angular/core';
import { AppContextService } from '../../../core/services/app-context.service';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
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
  Ticket,
} from '../../../core/models/fixify.models';
import { AddSiteModalComponent } from '../../../features/modals/add-site-modal/add-site-modal.component';
import { AddCustomerModalComponent } from '../../../features/modals/add-customer-modal/add-customer-modal.component';
import { EditCustomerModalComponent } from '../../../features/modals/edit-customer-modal/edit-customer-modal.component';
import { ViewCustomerModalComponent } from '../../../features/modals/view-customer-modal/view-customer-modal.component';
import { CreateTicketModalComponent } from '../../../features/modals/create-ticket-modal/create-ticket-modal.component';
import { ViewTicketModalComponent } from '../../../features/modals/view-ticket-modal/view-ticket-modal.component';
import { ConfirmModalComponent } from '../../../features/modals/confirm-modal/confirm-modal.component';
import { CreateProcessModalComponent } from '../../../features/modals/create-process-modal/create-process-modal.component';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  imports: [
    AddSiteModalComponent,
    AddCustomerModalComponent,
    EditCustomerModalComponent,
    ViewCustomerModalComponent,
    CreateTicketModalComponent,
    ViewTicketModalComponent,
    ConfirmModalComponent,
    CreateProcessModalComponent,
    SubscriptionPlanModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modal(); as m) {
      <div
        class="overlay"
        role="presentation"
        (click)="close()"
      >
        <div
          [class]="modalClass(m)"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
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
                [sites]="data.sites"
                [tickets]="data.tickets"
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
            @case ('viewTicket') {
              <app-view-ticket-modal
                [ticket]="asTicket(m.data)"
                (closed)="close()"
                (submitted)="onUpdateTicket($event)"
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
                [sites]="m.sites ?? data.sites"
                (closed)="close()"
                (submitted)="onCreateProcess($event, m)"
              />
            }
            @case ('subscriptionPlan') {
              <app-subscription-plan-modal
                [plan]="asPlan(m.data)"
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
  protected readonly data = inject(FixifyDataService);

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
    const large = m.type === 'viewCustomer' || m.type === 'viewTicket';
    return large ? 'mdl mdl-lg' : 'mdl';
  }

  close(): void {
    this.ctx.closeModal();
  }

  asCustomer(data: unknown): Customer {
    return data as Customer;
  }

  asTicket(data: unknown): Ticket {
    return data as Ticket;
  }

  asPlan(data: unknown): SubscriptionPlan | null {
    return (data as SubscriptionPlan) ?? null;
  }

  ticketSites(m: ModalState) {
    return m.sites ?? this.data.sites;
  }

  onAddSite(payload: AddSitePayload): void {
    this.data.addSite(payload);
  }

  onAddCustomer(payload: AddCustomerPayload): void {
    this.data.addCustomer(payload);
  }

  onEditCustomer(updated: Customer, m: ModalState): void {
    if (m.onSubmit) {
      m.onSubmit(updated);
      this.close();
    } else {
      this.data.updateCustomer(updated);
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

  onCreateTicket(payload: CreateTicketPayload): void {
    this.data.createTicket(payload);
  }

  onUpdateTicket(changes: { id: string; status: Ticket['status']; who: string }): void {
    this.data.updateTicket(changes.id, {
      status: changes.status,
      who: changes.who,
    });
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
      this.data.createProcess(payload);
      this.close();
    }
  }

  onSubscriptionPlan(payload: SubscriptionPlanPayload, m: ModalState): void {
    const existing = m.data as SubscriptionPlan | undefined;
    if (existing?.id) {
      this.data.updateSubscriptionPlan(existing.id, payload);
    } else {
      this.data.createSubscriptionPlan(payload);
    }
  }
}
