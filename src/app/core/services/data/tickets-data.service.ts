import { Injectable, inject } from '@angular/core';
import { CreateTicketPayload, Ticket } from '../../models/fixify.models';
import { cloneMockData, MOCK_TICKETS } from '../../data/mock-data';
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

@Injectable({ providedIn: 'root' })
export class TicketsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly ticketsApi = inject(TicketsApiService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly sitesData = inject(SitesDataService);

  readonly tickets: Ticket[] = [];

  loadMockTickets(): void {
    this.tickets.splice(0, this.tickets.length, ...cloneMockData(MOCK_TICKETS));
  }

  fetchTickets(params?: { role?: string; clientId?: string }, done?: () => void): void {
    if (!this.session.useApi()) {
      this.loadMockTickets();
      this.session.bump();
      done?.();
      return;
    }
    this.session.beginLoad();
    this.ticketsApi.getTickets({ limit: 200, ...params }).subscribe({
      next: (res) => {
        this.tickets.splice(
          0,
          this.tickets.length,
          ...(res.data?.tickets ?? []).map((t) => mapApiTicketToFixify(t, this.ids))
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
    if (this.session.useApi()) {
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
            this.session.bump();
            this.toast.success(`Ticket ${ticket.id} created`);
            this.ctx.closeModal();
          },
          error: (err) => this.toast.error(err?.error?.message || 'Failed to create ticket'),
        });
      return;
    }

    this.createTicketLocal(data);
  }

  private createTicketLocal(data: CreateTicketPayload): void {
    const ticket: Ticket = {
      id: `FX-${Math.floor(Math.random() * 900 + 100)}`,
      title: data.title,
      desc: data.desc,
      site: data.site,
      custId: this.ctx.currentCustomerId(),
      type: data.type,
      pri: data.pri,
      status: data.status || 'open',
      who: data.who || 'Unassigned',
      ago: 'just now',
    };
    this.tickets.unshift(ticket);
    this.toast.success(`Ticket ${ticket.id} created`);
    this.ctx.closeModal();
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
