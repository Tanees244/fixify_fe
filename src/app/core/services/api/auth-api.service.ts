import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiEnvelope,
  CurrentUserResponseData,
  LoginRequest,
  LoginResponseData,
} from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService extends ApiBaseService {
  login(body: LoginRequest): Observable<ApiEnvelope<LoginResponseData>> {
    return this.http.post<ApiEnvelope<LoginResponseData>>(this.url('/api/auth/login'), body);
  }

  getCurrentUser(): Observable<ApiEnvelope<CurrentUserResponseData>> {
    return this.http.get<ApiEnvelope<CurrentUserResponseData>>(this.url('/api/auth/me'));
  }
}
