import { Injectable, inject, signal } from '@angular/core';
import {
  CreateTicketPayload,
  Ticket,
  TicketAttachment,
  TicketMessage,
  TicketMessageRole,
  TicketStatus,
} from '../../models/fixify.models';
import { relativeTime, ticketStatusLabel } from '../../utils/fixify.utils';
import { MOCK_TICKETS, MOCK_TICKET_MESSAGES } from '../../constants/mock-tickets';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { DataSessionService } from './data-session.service';

export interface FetchTicketsParams {
  role?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

interface AddMessageInput {
  authorName: string;
  authorRole: TicketMessageRole;
  body: string;
  attachments?: TicketAttachment[];
  isInternal?: boolean;
}

/**
 * Mock-first ticketing store. Tickets and their conversation threads are seeded
 * from local mock data so the AWS-style support experience is fully demonstrable
 * on both the admin and customer sides without a backend.
 */
@Injectable({ providedIn: 'root' })
export class TicketsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);

  readonly tickets: Ticket[] = [];
  readonly ticketsPage = signal(1);
  readonly ticketsLimit = signal(50);
  readonly ticketsTotal = signal(0);

  /** ticketId -> conversation thread (chronological). */
  private readonly messagesByTicket = new Map<string, TicketMessage[]>();
  private masterSeeded = false;
  private nextId = 2042;

  fetchTickets(params: FetchTicketsParams = {}, done?: () => void): void {
    this.seedMaster();

    const all = MOCK_TICKETS.map((t) => ({ ...t }));
    const isClient = params.role === 'client';
    const custId = this.ctx.currentCustomerId();
    const visible = isClient ? all.filter((t) => t.custId === custId) : all;

    this.tickets.splice(0, this.tickets.length, ...visible);
    this.ticketsPage.set(1);
    this.ticketsTotal.set(visible.length);
    this.session.bump();
    done?.();
  }

  ticketsForCustomer(custId: number): Ticket[] {
    this.seedMaster();
    return MOCK_TICKETS.filter((t) => t.custId === custId).map((t) => ({ ...t }));
  }

  getTicket(id: string): Ticket | undefined {
    this.seedMaster();
    return this.tickets.find((t) => t.id === id) ?? MOCK_TICKETS.find((t) => t.id === id);
  }

  getMessages(ticketId: string): TicketMessage[] {
    this.ensureThread(ticketId);
    return [...(this.messagesByTicket.get(ticketId) ?? [])].sort(
      (a, b) => a.createdAt - b.createdAt
    );
  }

  addMessage(ticketId: string, input: AddMessageInput): TicketMessage {
    this.ensureThread(ticketId);
    const now = Date.now();
    const message: TicketMessage = {
      id: `m-${ticketId}-${now}`,
      ticketId,
      authorName: input.authorName,
      authorRole: input.authorRole,
      body: input.body.trim(),
      ago: relativeTime(now),
      createdAt: now,
      attachments: input.attachments ?? [],
      isInternal: input.isInternal,
    };
    this.messagesByTicket.get(ticketId)!.push(message);

    // A customer or agent reply moves an untouched ticket into "in progress".
    if (input.authorRole !== 'system') {
      const ticket = this.findTicket(ticketId);
      if (ticket && ticket.status === 'open' && input.authorRole === 'agent') {
        this.applyStatus(ticket, 'inprogress');
      }
    }
    this.session.bump();
    return message;
  }

  setTicketStatus(id: string, status: TicketStatus, actorName: string): void {
    const ticket = this.findTicket(id);
    if (!ticket || ticket.status === status) return;
    this.ensureThread(id);
    this.applyStatus(ticket, status);
    const now = Date.now();
    this.messagesByTicket.get(id)!.push({
      id: `m-${id}-${now}`,
      ticketId: id,
      authorName: actorName,
      authorRole: 'system',
      body: `Status changed to ${ticketStatusLabel(status)} by ${actorName}.`,
      ago: relativeTime(now),
      createdAt: now,
      attachments: [],
    });
    this.session.bump();
    this.toast.success(`Ticket ${id} → ${ticketStatusLabel(status)}`);
  }

  /** Creates a ticket from the "open a case" form and returns its id. */
  createTicket(data: CreateTicketPayload): string {
    this.seedMaster();
    const id = `TK-${this.nextId++}`;
    const now = Date.now();
    const customer = MOCK_TICKETS.find((t) => t.custId === this.ctx.currentCustomerId());
    const ticket: Ticket = {
      id,
      title: data.title,
      site: data.site || '—',
      customerName: customer?.customerName,
      custId: this.ctx.currentCustomerId(),
      type: data.type || 'Bug',
      pri: data.pri,
      status: data.status ?? 'open',
      who: data.who || 'Unassigned',
      ago: 'just now',
      createdAt: now,
      desc: data.desc,
    };
    MOCK_TICKETS.unshift(ticket);
    this.tickets.unshift({ ...ticket });
    this.ticketsTotal.update((n) => n + 1);

    this.messagesByTicket.set(id, [
      {
        id: `m-${id}-${now}`,
        ticketId: id,
        authorName: ticket.customerName || 'You',
        authorRole: 'customer',
        body: data.desc || data.title,
        ago: 'just now',
        createdAt: now,
        attachments: data.attachments ?? [],
      },
    ]);

    this.session.bump();
    this.toast.success(`Ticket ${id} created`);
    this.ctx.closeModal();
    return id;
  }

  updateTicket(id: string, changes: Partial<Ticket>): void {
    const ticket = this.findTicket(id);
    if (ticket) {
      Object.assign(ticket, changes);
      this.syncMaster(id, changes);
      this.session.bump();
      if (changes.status) {
        this.toast.success(`Ticket ${id} → ${ticketStatusLabel(changes.status)}`);
      }
    }
    this.ctx.closeModal();
  }

  private applyStatus(ticket: Ticket, status: TicketStatus): void {
    ticket.status = status;
    this.syncMaster(ticket.id, { status });
  }

  private findTicket(id: string): Ticket | undefined {
    return this.tickets.find((t) => t.id === id) ?? MOCK_TICKETS.find((t) => t.id === id);
  }

  private syncMaster(id: string, changes: Partial<Ticket>): void {
    const master = MOCK_TICKETS.find((t) => t.id === id);
    if (master) Object.assign(master, changes);
    const visible = this.tickets.find((t) => t.id === id);
    if (visible) Object.assign(visible, changes);
  }

  private seedMaster(): void {
    if (this.masterSeeded) return;
    this.masterSeeded = true;
    for (const [ticketId, msgs] of Object.entries(MOCK_TICKET_MESSAGES)) {
      this.messagesByTicket.set(
        ticketId,
        msgs.map((m) => ({ ...m, attachments: [...m.attachments] }))
      );
    }
  }

  private ensureThread(ticketId: string): void {
    this.seedMaster();
    if (this.messagesByTicket.has(ticketId)) return;
    const ticket = this.findTicket(ticketId);
    const created = ticket?.createdAt ?? Date.now();
    this.messagesByTicket.set(ticketId, [
      {
        id: `m-${ticketId}-seed`,
        ticketId,
        authorName: ticket?.customerName || 'Customer',
        authorRole: 'customer',
        body: ticket?.desc || 'No description provided.',
        ago: ticket?.ago || relativeTime(created),
        createdAt: created,
        attachments: [],
      },
    ]);
  }
}
