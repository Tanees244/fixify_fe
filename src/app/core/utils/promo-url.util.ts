export interface SafePromoUrl {
  url: string;
  /** true = open in a new tab; false = in-app route. */
  external: boolean;
}

/**
 * Admin-entered links are rendered as-is, so only allow in-app paths ("/customer/billing")
 * and http(s) URLs. Anything else (javascript:, data:, …) is dropped.
 */
export function safePromoUrl(raw: string | null | undefined): SafePromoUrl | null {
  const url = (raw ?? '').trim();
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return { url, external: false };
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.protocol === 'http:') return { url: u.toString(), external: true };
  } catch {
    /* not a URL */
  }
  return null;
}
