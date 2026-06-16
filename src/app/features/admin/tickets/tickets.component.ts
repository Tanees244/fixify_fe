import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { Customer, Ticket, TicketStatus } from '../../../core/models/fixify.models';
import { priorityBadge, ticketStatusLabel } from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './tickets.component.html',
})
export class TicketsComponent {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);

  readonly tickets = this.data.tickets;
  readonly customers = this.data.customers;
  readonly loading = this.data.loading;

  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly priorityFilter = signal('all');
  readonly customerFilter = signal('all');

  readonly priorityBadge = priorityBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  readonly openCount = computed(() => {
    this.data.dataRevision();
    return this.tickets.filter((t) => t.status !== 'resolved').length;
  });

  readonly filteredTickets = computed(() => {
    this.data.dataRevision();
    const q = this.search().toLowerCase();
    const status = this.statusFilter();
    const pri = this.priorityFilter();
    const cust = this.customerFilter();

    return this.tickets.filter(
      (t) =>
        (status === 'all' || t.status === status) &&
        (pri === 'all' || t.pri === pri) &&
        (cust === 'all' || String(t.custId) === cust) &&
        (q === '' ||
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q))
    );
  });

  customerFor(custId: number): Customer | undefined {
    return this.customers.find((c) => c.id === custId);
  }

  customerName(t: Ticket): string {
    return t.customerName ?? this.customerFor(t.custId)?.name ?? '—';
  }

  typeBadge(type: string): BadgeVariant {
    return type === 'Security' ? 'bac' : type === 'Performance' ? 'bwn' : 'bbl';
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  setPriorityFilter(value: string): void {
    this.priorityFilter.set(value);
  }

  setCustomerFilter(value: string): void {
    this.customerFilter.set(value);
  }

  createTicket(): void {
    this.ctx.openModal({ type: 'createTicket' });
  }

  viewTicket(ticket: Ticket): void {
    this.ctx.openModal({ type: 'viewTicket', data: ticket });
  }

  updateStatus(ticketId: string, status: TicketStatus, event: Event): void {
    event.stopPropagation();
    this.data.updateTicket(ticketId, { status });
  }
}
