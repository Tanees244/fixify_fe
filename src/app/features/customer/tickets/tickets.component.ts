import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataSessionService, SitesDataService, TicketsDataService } from '../../../core/services/data';
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

  private readonly session = inject(DataSessionService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly Math = Math;

  readonly priorityBadge = priorityBadge;
  readonly priorityColor = priorityColor;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  readonly statusFilter = signal<'all' | TicketStatus>('all');
  readonly priorityFilter = signal<'all' | TicketPriority>('all');
  readonly search = signal('');
  readonly loading = this.session.loading;
  readonly ticketsPage = this.ticketsData.ticketsPage;
  readonly ticketsLimit = this.ticketsData.ticketsLimit;
  readonly ticketsTotal = this.ticketsData.ticketsTotal;

  readonly tickets = computed(() => {
    this.session.dataRevision();
    return this.ticketsData.tickets;
  });

  readonly openCount = computed(() => {
    this.session.dataRevision();
    return this.tickets().filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;
  });

  readonly totalPages = computed(() => {
    this.ticketsTotal();
    this.session.dataRevision();
    const total = this.ticketsTotal() || this.tickets().length;
    return Math.max(1, Math.ceil(total / this.ticketsLimit()));
  });

  readonly showPagination = computed(() => {
    this.ticketsTotal();
    this.session.dataRevision();
    if (this.loading()) return false;
    return this.ticketsTotal() > 0 || this.tickets().length > 0;
  });

  readonly filteredTickets = computed(() => {
    this.session.dataRevision();
    const search = this.search().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return this.tickets().filter(
      (t) =>
        (status === 'all' || t.status === status) &&
        (priority === 'all' || t.pri === priority) &&
        (search === '' ||
          t.title.toLowerCase().includes(search) ||
          (t.number ?? '').toLowerCase().includes(search))
    );
  });

  ticketTypeBadge(type: string): 'bac' | 'bwn' | 'bbl' {
    if (type === 'Security') return 'bac';
    if (type === 'Performance') return 'bwn';
    return 'bbl';
  }

  createTicket(): void {
    this.ctx.openModal({ type: 'createTicket', sites: this.sitesData.mySites() });
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/customer/tickets', ticket.id]);
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(1, page), this.totalPages());
    if (next === this.ticketsPage()) return;
    this.ticketsData.fetchTickets({ role: 'client', page: next, limit: this.ticketsLimit() });
  }
}
