import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { tw } from '../../../../shared/ui/tw';

@Component({
  selector: 'app-site-manage-security',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './security-screen.component.html',
})
export class SecurityScreenComponent {
  protected readonly ui = tw;
  protected readonly facade = inject(SiteManageFacade);

  readonly scanAreas = [
    'Malware and suspicious file detection',
    'Known plugin and theme vulnerabilities',
    'WordPress core security patches',
    'Weak passwords and admin user audit',
    'File permission checks',
  ];

  readonly vulnerableCount = computed(
    () => this.facade.wpState()?.plugins.filter((p) => p.status === 'vulnerable').length ?? 0
  );

  readonly hasVulnerablePlugins = computed(() => this.vulnerableCount() > 0);

  async runScan(): Promise<void> {
    await this.facade.runAction('run_security_scan');
  }
}
