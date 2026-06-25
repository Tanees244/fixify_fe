import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiEnvelope,
  ChangePasswordRequest,
  CurrentUserResponseData,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  VerifyResetPasswordRequest,
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

  changePassword(body: ChangePasswordRequest): Observable<ApiEnvelope<null>> {
    return this.http.post<ApiEnvelope<null>>(this.url('/api/auth/change-password'), body);
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<ApiEnvelope<boolean>> {
    return this.http.post<ApiEnvelope<boolean>>(this.url('/api/auth/forgot-password'), body);
  }

  verifyResetPassword(body: VerifyResetPasswordRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      this.url('/api/auth/verify-reset-password'),
      body
    );
  }

  updateUser(
    id: string,
    fields: { name?: string; email?: string; phone?: string; role?: string; password?: string }
  ): Observable<ApiEnvelope<unknown>> {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null && value !== '') {
        form.append(key, value);
      }
    }
    return this.http.patch<ApiEnvelope<unknown>>(this.url(`/users/${encodeURIComponent(id)}`), form);
  }
}
