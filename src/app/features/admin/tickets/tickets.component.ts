import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  DataSessionService,
  CustomersDataService,
  TicketsDataService,
} from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { Customer, Ticket } from '../../../core/models/fixify.models';
import { priorityBadge, ticketStatusBadge, ticketStatusLabel } from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './tickets.component.html',
})
export class TicketsComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly Math = Math;

  readonly tickets = this.ticketsData.tickets;
  readonly customers = this.customersData.customers;
  readonly loading = this.session.loading;
  readonly ticketsPage = this.ticketsData.ticketsPage;
  readonly ticketsLimit = this.ticketsData.ticketsLimit;
  readonly ticketsTotal = this.ticketsData.ticketsTotal;

  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly priorityFilter = signal('all');
  readonly customerFilter = signal('all');

  readonly priorityBadge = priorityBadge;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  readonly openCount = computed(() => {
    this.session.dataRevision();
    return this.tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;
  });

  readonly totalPages = computed(() => {
    this.ticketsTotal();
    this.session.dataRevision();
    const total = this.ticketsTotal() || this.tickets.length;
    return Math.max(1, Math.ceil(total / this.ticketsLimit()));
  });

  readonly showPagination = computed(() => {
    this.ticketsTotal();
    this.session.dataRevision();
    if (this.loading()) return false;
    return this.ticketsTotal() > 0 || this.tickets.length > 0;
  });

  readonly filteredTickets = computed(() => {
    this.session.dataRevision();
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
    this.router.navigate(['/admin/tickets', ticket.id]);
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(1, page), this.totalPages());
    if (next === this.ticketsPage()) return;
    this.ticketsData.fetchTickets({ page: next, limit: this.ticketsLimit() });
  }
}
