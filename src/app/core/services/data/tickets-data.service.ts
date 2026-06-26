import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CreateTicketPayload,
  Ticket,
  TicketAttachment,
  TicketMessage,
  TicketMessageRole,
  TicketStatus,
} from '../../models/fixify.models';
import {
  ApiTicketAttachmentInput,
  CreateTicketRequest,
} from '../../models/api.models';
import {
  apiTicketStatus,
  normalizeTicketPriority,
  prettyTicketCategory,
  relativeTime,
  ticketStatusLabel,
  ticketStatusToApi,
} from '../../utils/fixify.utils';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { EntityIdRegistry } from '../entity-id-registry.service';
import { TicketsApiService } from '../api/tickets-api.service';
import { MediaBucketService } from '../api/media-bucket.service';
import { DataSessionService } from './data-session.service';

export interface FetchTicketsParams {
  role?: string;
  clientId?: string;
  websiteId?: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

interface AddMessageInput {
  body: string;
  files?: File[];
  isInternal?: boolean;
}

interface RawSender {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  label?: string;
  initials?: string;
}

interface RawAttachment {
  fileName?: string;
  contentType?: string;
  key?: string;
  size?: number;
  url?: string;
}

interface RawMessage {
  id: string;
  ticketId: string;
  message?: string;
  kind?: string;
  isInternal?: boolean;
  sender?: RawSender;
  attachments?: RawAttachment[];
  createdAt?: string;
  ago?: string;
}

interface RawTicket {
  id: string;
  ticketNumber?: string;
  subject?: string;
  title?: string;
  site?: string;
  website?: string;
  custId?: string | null;
  category?: string;
  type?: string;
  severity?: string;
  pri?: string;
  status?: string;
  ago?: string;
  description?: string;
  desc?: string;
  closedAt?: string | null;
  messages?: RawMessage[];
  createdAt?: string;
}

/**
 * API-backed ticketing store. Tickets, their conversation threads, attachments
 * and status changes are served by the backend `/api/tickets/*` endpoints; image
 * attachments are uploaded to S3 via the media bucket presign flow.
 */
@Injectable({ providedIn: 'root' })
export class TicketsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly api = inject(TicketsApiService);
  private readonly media = inject(MediaBucketService);

  readonly tickets: Ticket[] = [];
  readonly ticketsPage = signal(1);
  readonly ticketsLimit = signal(10);
  readonly ticketsTotal = signal(0);

  /** ticketId -> conversation thread (chronological). */
  private readonly messagesByTicket = new Map<string, TicketMessage[]>();
  /** Detail view cache so an opened ticket survives list re-pagination. */
  private readonly ticketById = new Map<string, Ticket>();

  fetchTickets(params: FetchTicketsParams = {}, done?: () => void): void {
    if (!this.session.useApi()) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.api
      .getTickets({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        status: params.status,
        priority: params.priority,
        clientId: params.clientId,
        search: params.search,
        role: params.role,
      })
      .subscribe({
        next: (res) => {
          const data = res.data;
          const items = (data?.items ?? [])
            .map((t) => this.unwrapRawTicket(t))
            .filter((t): t is RawTicket => !!t)
            .map((t) => this.mapTicket(t));
          this.tickets.splice(0, this.tickets.length, ...items);
          this.ticketsPage.set(data?.page ?? params.page ?? 1);
          this.ticketsLimit.set(data?.limit ?? params.limit ?? 10);
          this.ticketsTotal.set(data?.total ?? items.length);
          this.session.endLoad();
          this.session.bump();
          done?.();
        },
        error: () => {
          this.session.endLoad();
          this.toast.error('Failed to load tickets');
          done?.();
        },
      });
  }

  /** Loads a single ticket plus its full conversation thread. */
  fetchTicketDetail(id: string, done?: () => void): void {
    if (!id || !this.session.useApi()) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.api.getTicketById(id).subscribe({
      next: (res) => {
        const raw = this.unwrapRawTicket(res.data);
        if (raw) {
          const ticket = this.mapTicket(raw);
          this.ticketById.set(id, ticket);
          this.upsertTicket(ticket);
          this.messagesByTicket.set(
            id,
            (raw.messages ?? []).map((m) => this.mapMessage(m))
          );
        }
        this.session.endLoad();
        this.session.bump();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load ticket');
        done?.();
      },
    });
  }

  fetchMessages(id: string, done?: () => void): void {
    if (!id || !this.session.useApi()) {
      done?.();
      return;
    }
    this.api.getTicketMessages(id, { page: 1, limit: 100 }).subscribe({
      next: (res) => {
        const msgs = (res.data?.messages ?? []) as RawMessage[];
        this.messagesByTicket.set(id, msgs.map((m) => this.mapMessage(m)));
        this.session.bump();
        done?.();
      },
      error: () => done?.(),
    });
  }

  getTicket(id: string): Ticket | undefined {
    return this.tickets.find((t) => t.id === id) ?? this.ticketById.get(id);
  }

  getMessages(ticketId: string): TicketMessage[] {
    return [...(this.messagesByTicket.get(ticketId) ?? [])].sort(
      (a, b) => a.createdAt - b.createdAt
    );
  }

  ticketsForCustomer(localCustId: number): Ticket[] {
    return this.tickets.filter((t) => t.custId === localCustId);
  }

  async addMessage(ticketId: string, input: AddMessageInput): Promise<void> {
    const body = input.body.trim();
    const attachments = await this.uploadFiles(input.files);
    if (!body && attachments.length === 0) return;
    try {
      const res = await firstValueFrom(
        this.api.addTicketMessage(ticketId, {
          message: body || '(no message)',
          isInternal: !!input.isInternal,
          attachments,
        })
      );
      const raw = res.data as RawMessage | undefined;
      if (raw) {
        const thread = this.messagesByTicket.get(ticketId) ?? [];
        thread.push(this.mapMessage(raw));
        this.messagesByTicket.set(ticketId, thread);
        this.session.bump();
      } else {
        this.fetchMessages(ticketId);
      }
    } catch {
      this.toast.error('Failed to send message');
    }
  }

  async setTicketStatus(id: string, status: TicketStatus): Promise<void> {
    try {
      if (status === 'resolved' || status === 'closed') {
        await firstValueFrom(this.api.resolveTicket(id, {}));
      } else {
        await firstValueFrom(
          this.api.updateTicketStatus(id, { status: ticketStatusToApi(status) })
        );
      }
      // Refetch so the ticket + the backend-posted system message stay in sync.
      this.fetchTicketDetail(id);
      this.toast.success(`Ticket → ${ticketStatusLabel(status)}`);
    } catch {
      this.toast.error('Failed to update ticket status');
    }
  }

  /** Creates a ticket from the "open a case" form and returns its id (or null). */
  async createTicket(data: CreateTicketPayload): Promise<string | null> {
    if (!this.session.useApi()) {
      this.toast.error('Cannot create ticket right now');
      return null;
    }
    const attachments = await this.uploadFiles(data.files);
    const body: CreateTicketRequest = {
      subject: data.subject.trim(),
      website: data.websiteId,
      category: (data.category || 'general').toLowerCase(),
      severity: data.severity,
      description: data.description.trim(),
      attachments,
      custId: data.custId ?? null,
    };
    try {
      const res = await firstValueFrom(this.api.createTicket(body));
      const raw = this.unwrapRawTicket(res.data);
      if (!raw) {
        this.toast.error('Failed to create ticket');
        return null;
      }
      const ticket = this.mapTicket(raw);
      this.ticketById.set(ticket.id, ticket);
      this.upsertTicket(ticket, true);
      this.ticketsTotal.update((n) => n + 1);
      this.messagesByTicket.delete(ticket.id);
      this.session.bump();
      this.toast.success(`Ticket ${ticket.number ?? ''} created`.trim());
      this.ctx.closeModal();
      return ticket.id;
    } catch {
      this.toast.error('Failed to create ticket');
      return null;
    }
  }

  // —— internals ——

  /** Accepts a flat ticket object or legacy `{ ticket }` wrapper from the API. */
  private unwrapRawTicket(data: unknown): RawTicket | undefined {
    if (!data || typeof data !== 'object') return undefined;
    const obj = data as Record<string, unknown>;
    if (typeof obj['id'] === 'string') return obj as unknown as RawTicket;
    if (obj['ticket'] && typeof obj['ticket'] === 'object') {
      return this.unwrapRawTicket(obj['ticket']);
    }
    return undefined;
  }

  private async uploadFiles(files: File[] | undefined): Promise<ApiTicketAttachmentInput[]> {
    const list = files ?? [];
    if (!list.length) return [];
    const out: ApiTicketAttachmentInput[] = [];
    for (const file of list) {
      try {
        out.push(await this.media.uploadFile(file, 'tickets'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        this.toast.error(`Failed to upload ${file.name}: ${msg}`);
        throw err;
      }
    }
    return out;
  }

  private upsertTicket(ticket: Ticket, prepend = false): void {
    const idx = this.tickets.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) {
      this.tickets[idx] = ticket;
    } else if (prepend) {
      this.tickets.unshift(ticket);
    } else {
      this.tickets.push(ticket);
    }
  }

  private mapTicket(raw: RawTicket): Ticket {
    const custId = raw.custId ? this.ids.clientLocalId(raw.custId) : 0;
    const created = raw.createdAt ? Date.parse(raw.createdAt) : NaN;
    return {
      id: raw.id,
      apiId: raw.id,
      number: raw.ticketNumber,
      title: raw.subject ?? raw.title ?? 'Untitled ticket',
      site: raw.site ?? raw.website ?? '—',
      custId,
      type: prettyTicketCategory(raw.category ?? raw.type),
      pri: normalizeTicketPriority(raw.severity ?? raw.pri),
      status: apiTicketStatus(raw.status),
      who: 'Unassigned',
      ago: raw.ago ?? (Number.isNaN(created) ? 'just now' : relativeTime(created)),
      desc: raw.description ?? raw.desc ?? '',
      createdAt: Number.isNaN(created) ? Date.now() : created,
    };
  }

  private mapMessage(raw: RawMessage): TicketMessage {
    const role: TicketMessageRole =
      raw.kind === 'system'
        ? 'system'
        : raw.sender?.role === 'admin'
        ? 'agent'
        : 'customer';
    const created = raw.createdAt ? Date.parse(raw.createdAt) : Date.now();
    return {
      id: raw.id,
      ticketId: raw.ticketId,
      authorName:
        raw.sender?.label ||
        raw.sender?.name ||
        (role === 'agent' ? 'Fixify Support' : 'Customer'),
      authorRole: role,
      body: raw.message ?? '',
      ago: raw.ago ?? relativeTime(created),
      createdAt: Number.isNaN(created) ? Date.now() : created,
      attachments: (raw.attachments ?? []).map((a) => this.mapAttachment(a)),
      isInternal: !!raw.isInternal,
    };
  }

  private mapAttachment(a: RawAttachment): TicketAttachment {
    return {
      id: a.key || a.url || `att-${Math.random().toString(36).slice(2)}`,
      url: a.url ?? '',
      name: a.fileName || 'attachment',
      kind: (a.contentType || '').startsWith('image/') ? 'image' : 'file',
    };
  }
}
