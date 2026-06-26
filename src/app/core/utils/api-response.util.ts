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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** API list payloads use `items` (WebCare) or legacy `tickets` / `clients` / etc. */
export function extractApiItems(data: unknown): unknown[] {
  if (!isRecord(data)) return [];
  if (Array.isArray(data['items'])) return data['items'];
  if (Array.isArray(data['tickets'])) return data['tickets'];
  if (Array.isArray(data['clients'])) return data['clients'];
  if (Array.isArray(data['websites'])) return data['websites'];
  return [];
}

export function extractApiListMeta(
  data: unknown,
  itemCount = 0
): {
  total: number;
  page: number;
  limit: number;
} {
  if (!isRecord(data)) {
    return { total: itemCount, page: 1, limit: 10 };
  }

  const pagination = isRecord(data['pagination']) ? data['pagination'] : data;
  const total = Number(
    pagination['total'] ??
      pagination['totalCount'] ??
      pagination['count'] ??
      data['total'] ??
      data['totalCount'] ??
      itemCount
  );
  const page = Number(pagination['page'] ?? data['page'] ?? 1);
  const limit = Number(pagination['limit'] ?? data['limit'] ?? 10);

  return {
    total: total || itemCount,
    page: page || 1,
    limit: limit || 10,
  };
}

