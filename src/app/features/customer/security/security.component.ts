import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { scoreColor, severityBadge, severityBg, severityIcon } from '../../../core/utils/fixify.utils';

interface Vulnerability {
  key: string;
  title: string;
  sev: 'critical' | 'high' | 'medium';
  type: string;
  fix: string;
}

@Component({
  selector: 'app-customer-security',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent],
  templateUrl: './security.component.html',
})
export class SecurityComponent {
  private readonly data = inject(FixifyDataService);
  readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly scoreColor = scoreColor;
  readonly severityBadge = severityBadge;
  readonly severityBg = severityBg;
  readonly severityIcon = severityIcon;

  readonly fixed = signal<Record<string, boolean>>({});

  readonly vulns: Vulnerability[] = [
    { key: 'v1', title: 'WooCommerce SQL Injection (CVE-2024-4823)', sev: 'critical', type: 'Plugin Vuln', fix: 'Update to 8.4.0' },
    { key: 'v2', title: 'Outdated jQuery 1.12.4 (CVE-2020-11022)', sev: 'high', type: 'Outdated Library', fix: 'Upgrade to v3.7' },
    { key: 'v3', title: 'WordPress core 6.3.2 — 3 patches behind', sev: 'high', type: 'Core Update', fix: 'Update to 6.5.4' },
    { key: 'v4', title: 'X-Frame-Options header missing', sev: 'medium', type: 'Security Header', fix: 'Add header' },
    { key: 'v5', title: 'Content-Security-Policy not configured', sev: 'medium', type: 'Security Header', fix: 'Configure CSP' },
  ];

  readonly site = computed(() => this.ctx.selectedSite());

  readonly activeVulns = computed(() =>
    this.vulns.filter((v) => !this.fixed()[v.key])
  );

  readonly criticalCount = computed(
    () => this.activeVulns().filter((v) => v.sev === 'critical').length
  );

  readonly checklist = computed(() => {
    const fixed = this.fixed();
    return [
      { label: 'SSL Certificate', ok: true },
      { label: 'HTTPS Redirect', ok: true },
      { label: 'HSTS Header', ok: true },
      { label: 'X-Frame-Options', ok: !!fixed['v4'] },
      { label: 'Content-Security-Policy', ok: !!fixed['v5'] },
      { label: 'WAF / Firewall Active', ok: true },
    ];
  });

  applyFix(vuln: Vulnerability): void {
    this.fixed.update((f) => ({ ...f, [vuln.key]: true }));
    this.toast.success(`Applied: ${vuln.fix}`);
  }

  async rescan(): Promise<void> {
    const site = this.site();
    if (!site) return;
    await this.data.scanSite(site);
  }
}
