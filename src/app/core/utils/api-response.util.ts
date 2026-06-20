import { ApiEnvelope } from '../models/api.models';

export function isApiErrorEnvelope<T>(res: ApiEnvelope<T>): boolean {
  if (res.success === false) return true;
  if (res.status != null && res.status >= 400) return true;
  return false;
}

export function apiEnvelopeMessage(
  res: ApiEnvelope<unknown>,
  fallback = 'Request failed'
): string {
  return res.message || fallback;
}

export function isEmailAlreadyExistsError(
  message: string,
  status?: number
): boolean {
  if (status === 409) return true;
  return /email.*already exists/i.test(message);
}
