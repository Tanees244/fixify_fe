import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiEnvelope,
  CreateClientRequest,
  CreateClientResponseData,
  GetClientsParams,
} from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class ClientsApiService extends ApiBaseService {
  createClient(body: CreateClientRequest): Observable<ApiEnvelope<CreateClientResponseData>> {
    return this.http.post<ApiEnvelope<CreateClientResponseData>>(this.url('/admin/clients'), body);
  }

  getClients(
    params: GetClientsParams = {}
  ): Observable<ApiEnvelope<{ clients: unknown[]; pagination: unknown }>> {
    return this.http.get<ApiEnvelope<{ clients: unknown[]; pagination: unknown }>>(
      this.url('/admin/clients'),
      {
        params: this.buildParams({
          page: params.page ?? 1,
          limit: params.limit ?? 100,
          status: params.status,
          search: params.search,
        }),
      }
    );
  }

  getClientById(clientProfileId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(
      this.url(`/admin/clients/${encodeURIComponent(clientProfileId)}`)
    );
  }

  deleteClient(clientProfileId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.delete<ApiEnvelope<unknown>>(
      this.url(`/admin/clients/${encodeURIComponent(clientProfileId)}`)
    );
  }

  activateClient(clientProfileId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.patch<ApiEnvelope<unknown>>(
      this.url(`/admin/clients/${encodeURIComponent(clientProfileId)}/activate`),
      {}
    );
  }

  deactivateClient(clientProfileId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.patch<ApiEnvelope<unknown>>(
      this.url(`/admin/clients/${encodeURIComponent(clientProfileId)}/deactivate`),
      {}
    );
  }
}
