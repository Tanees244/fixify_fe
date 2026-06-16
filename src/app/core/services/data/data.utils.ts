export function parseSiteName(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function buildTriggerDetail(trigger: string, day: string, time?: string): string {
  const suffix = day === '1' ? 'st' : day === '2' ? 'nd' : day === '3' ? 'rd' : 'th';
  if (trigger === 'monthly') return `Day ${day}${suffix} of month at ${time || '2:00 AM'}`;
  if (trigger === 'weekly') return `Every ${day} at ${time || '4:00 AM'}`;
  return `Daily at ${time || '2:00 AM'}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatNow(): string {
  return (
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

export function monthLabelFromKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function siteUrl(site: { domain?: string; name: string }): string {
  return site.domain?.startsWith('http') ? site.domain : `https://${site.name}`;
}
