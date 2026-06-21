import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddTicketMessageRequest,
  ApiEnvelope,
  CreateTicketRequest,
  GetTicketsParams,
  UpdateTicketStatusRequest,
} from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class TicketsApiService extends ApiBaseService {
  createTicket(body: CreateTicketRequest): Observable<ApiEnvelope<{ ticket: unknown }>> {
    return this.http.post<ApiEnvelope<{ ticket: unknown }>>(this.url('/api/tickets'), body);
  }

  getTickets(
    params: GetTicketsParams = {}
  ): Observable<
    ApiEnvelope<{ items: unknown[]; total: number; page: number; limit: number }>
  > {
    return this.http.get<
      ApiEnvelope<{ items: unknown[]; total: number; page: number; limit: number }>
    >(
      this.url('/api/tickets'),
      {
        params: this.buildParams({
          page: params.page ?? 1,
          limit: params.limit ?? 100,
          status: params.status,
          priority: params.priority,
          clientId: params.clientId,
          assignedTo: params.assignedTo,
          search: params.search,
          role: params.role,
        }),
      }
    );
  }

  getTicketById(ticketId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(
      this.url(`/api/tickets/${encodeURIComponent(ticketId)}`)
    );
  }

  updateTicketStatus(
    ticketId: string,
    body: UpdateTicketStatusRequest
  ): Observable<ApiEnvelope<unknown>> {
    return this.http.patch<ApiEnvelope<unknown>>(
      this.url(`/api/tickets/${encodeURIComponent(ticketId)}/status`),
      body
    );
  }

  addTicketMessage(ticketId: string, body: AddTicketMessageRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      this.url(`/api/tickets/${encodeURIComponent(ticketId)}/messages`),
      body
    );
  }

  getTicketMessages(
    ticketId: string,
    params: { page?: number; limit?: number } = {}
  ): Observable<ApiEnvelope<{ messages: unknown[]; pagination: unknown }>> {
    return this.http.get<ApiEnvelope<{ messages: unknown[]; pagination: unknown }>>(
      this.url(`/api/tickets/${encodeURIComponent(ticketId)}/messages`),
      { params: this.buildParams({ page: params.page ?? 1, limit: params.limit ?? 50 }) }
    );
  }
}
