import { Injectable, inject, signal } from '@angular/core';
import { CreateTicketPayload, Ticket } from '../../models/fixify.models';
import {
  extractApiItems,
  extractApiListMeta,
} from '../../utils/api-response.util';
import {
  fixifyPriorityToApi,
  fixifyStatusToApi,
  mapApiTicketToFixify,
} from '../../utils/api-mappers.util';
import { ticketStatusLabel } from '../../utils/fixify.utils';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { EntityIdRegistry } from '../entity-id-registry.service';
import { TicketsApiService } from '../api/tickets-api.service';
import { DataSessionService } from './data-session.service';
import { SitesDataService } from './sites-data.service';

export interface FetchTicketsParams {
  role?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly ticketsApi = inject(TicketsApiService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly sitesData = inject(SitesDataService);

  readonly tickets: Ticket[] = [];
  readonly ticketsPage = signal(1);
  readonly ticketsLimit = signal(10);
  readonly ticketsTotal = signal(0);

  fetchTickets(params: FetchTicketsParams = {}, done?: () => void): void {
    if (!this.session.useApi()) {
      this.tickets.splice(0, this.tickets.length);
      this.ticketsTotal.set(0);
      done?.();
      return;
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 200;

    this.session.beginLoad();
    this.ticketsApi.getTickets({ page, limit, ...params }).subscribe({
      next: (res) => {
        const items = extractApiItems(res.data);
        const meta = extractApiListMeta(res.data, items.length);
        this.ticketsPage.set(meta.page || page);
        this.ticketsLimit.set(meta.limit || limit);
        this.ticketsTotal.set(meta.total);

        this.tickets.splice(
          0,
          this.tickets.length,
          ...items.map((t) => mapApiTicketToFixify(t, this.ids))
        );
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load tickets');
        done?.();
      },
    });
  }

  ticketsForCustomer(custId: number): Ticket[] {
    return this.tickets.filter((t) => t.custId === custId);
  }

  createTicket(data: CreateTicketPayload): void {
    if (!this.session.useApi()) {
      this.toast.error('Sign in to create tickets');
      return;
    }
    const siteRow = this.sitesData.sites.find(
      (s) => s.name === data.site || s.id === Number(data.site)
    );
    const websiteId = siteRow?.apiId ?? this.sitesData.websiteApiId(Number(data.site));
    if (!websiteId) {
      this.toast.error('Website not found for this ticket.');
      return;
    }
    this.ticketsApi
      .createTicket({
        websiteId,
        title: data.title,
        description: data.desc,
        priority: fixifyPriorityToApi(data.pri),
      })
      .subscribe({
        next: (res) => {
          const ticket = mapApiTicketToFixify(res.data?.ticket ?? res.data, this.ids);
          if (data.who) ticket.who = data.who;
          this.tickets.unshift(ticket);
          this.ticketsTotal.update((n) => n + 1);
          this.session.bump();
          this.toast.success(`Ticket ${ticket.id} created`);
          this.ctx.closeModal();
        },
        error: (err) => this.toast.error(err?.error?.message || 'Failed to create ticket'),
      });
  }

  updateTicket(id: string, changes: Partial<Ticket>): void {
    if (this.session.useApi() && changes.status) {
      const apiId = this.tickets.find((t) => t.id === id)?.apiId ?? id;
      this.ticketsApi.updateTicketStatus(apiId, { status: fixifyStatusToApi(changes.status) }).subscribe({
        next: () => this.updateTicketLocal(id, changes),
        error: (err) => this.toast.error(err?.error?.message || 'Failed to update ticket'),
      });
      return;
    }
    this.updateTicketLocal(id, changes);
  }

  private updateTicketLocal(id: string, changes: Partial<Ticket>): void {
    const idx = this.tickets.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.tickets[idx] = { ...this.tickets[idx], ...changes };
      this.session.bump();
      if (changes.status) {
        this.toast.success(`Ticket ${id} → ${ticketStatusLabel(changes.status)}`);
      }
    }
    this.ctx.closeModal();
  }
}
