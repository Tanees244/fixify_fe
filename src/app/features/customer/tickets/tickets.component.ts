import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { Ticket, TicketPriority, TicketStatus } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import {
  priorityBadge,
  priorityColor,
  ticketStatusBadge,
  ticketStatusLabel,
} from '../../../core/utils/fixify.utils';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-tickets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './tickets.component.html',
})
export class TicketsComponent {
  protected readonly ui = tw;

  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);

  readonly Math = Math;

  readonly priorityBadge = priorityBadge;
  readonly priorityColor = priorityColor;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  readonly statusFilter = signal<'all' | TicketStatus>('all');
  readonly priorityFilter = signal<'all' | TicketPriority>('all');
  readonly search = signal('');
  readonly loading = this.data.loading;
  readonly ticketsPage = this.data.ticketsPage;
  readonly ticketsLimit = this.data.ticketsLimit;
  readonly ticketsTotal = this.data.ticketsTotal;

  readonly tickets = computed(() => {
    this.data.dataRevision();
    return this.data.tickets;
  });

  readonly openCount = computed(() => {
    this.data.dataRevision();
    return this.tickets().filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;
  });

  readonly totalPages = computed(() => {
    this.ticketsTotal();
    this.data.dataRevision();
    const total = this.ticketsTotal() || this.tickets().length;
    return Math.max(1, Math.ceil(total / this.ticketsLimit()));
  });

  readonly showPagination = computed(() => {
    this.ticketsTotal();
    this.data.dataRevision();
    if (this.loading()) return false;
    return this.ticketsTotal() > 0 || this.tickets().length > 0;
  });

  readonly filteredTickets = computed(() => {
    this.data.dataRevision();
    const search = this.search().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return this.tickets().filter(
      (t) =>
        (status === 'all' || t.status === status) &&
        (priority === 'all' || t.pri === priority) &&
        (search === '' ||
          t.title.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search))
    );
  });

  ticketTypeBadge(type: string): 'bac' | 'bwn' | 'bbl' {
    if (type === 'Security') return 'bac';
    if (type === 'Performance') return 'bwn';
    return 'bbl';
  }

  createTicket(): void {
    this.ctx.openModal({
      type: 'createTicket',
      sites: this.data.mySites(),
      onSubmit: (payload) => this.data.createTicket(payload as never),
    });
  }

  viewTicket(ticket: Ticket): void {
    this.ctx.openModal({ type: 'viewTicket', data: ticket });
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(1, page), this.totalPages());
    if (next === this.ticketsPage()) return;
    this.data.fetchTickets({ role: 'client', page: next, limit: this.ticketsLimit() });
  }
}
