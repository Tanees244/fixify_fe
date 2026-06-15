import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateProcessPayload, Insight, Process } from '../../../core/models/fixify.models';
import { AI_SUGGESTIONS } from '../../../core/constants/fixify.constants';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ProcessCardComponent } from './process-card.component';
import { severityBadge, severityBg, severityIcon } from '../../../core/utils/fixify.utils';

type AiTab = 'ask' | 'insights' | 'processes';
type InsightFilter = 'All' | 'Critical' | 'High' | 'Medium' | 'Info';

@Component({
  selector: 'app-customer-ai-insights',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, BadgeComponent, ProcessCardComponent],
  templateUrl: './ai-insights.component.html',
})
export class AiInsightsComponent {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly severityBadge = severityBadge;
  readonly severityBg = severityBg;
  readonly severityIcon = severityIcon;
  readonly suggestions = AI_SUGGESTIONS;

  readonly tab = signal<AiTab>('ask');
  readonly question = signal('');
  readonly answer = signal('');
  readonly loading = signal(false);
  readonly filter = signal<InsightFilter>('All');
  readonly insights = signal<Insight[]>(this.data.getInsights());

  readonly processes = computed(() =>
    this.data.processes.filter((p) => p.custId === this.ctx.currentCustomerId())
  );

  readonly filteredInsights = computed(() => {
    const filter = this.filter();
    const all = this.insights();
    if (filter === 'All') return all;
    return all.filter(
      (i) => i.sev === filter.toLowerCase() || i.cat === filter
    );
  });

  readonly activeProcessCount = computed(
    () => this.processes().filter((p) => p.enabled).length
  );

  readonly pausedProcessCount = computed(
    () => this.processes().filter((p) => !p.enabled).length
  );

  readonly totalRuns = computed(() =>
    this.processes().reduce((a, p) => a + p.runs, 0)
  );

  setTab(tab: AiTab): void {
    this.tab.set(tab);
  }

  setFilter(filter: InsightFilter): void {
    this.filter.set(filter);
  }

  selectSuggestion(s: string): void {
    this.question.set(s);
    this.answer.set('');
  }

  async askAi(): Promise<void> {
    const q = this.question().trim();
    if (!q) return;

    this.loading.set(true);
    this.answer.set('');

    try {
      const resp = await this.data.askAi(q);
      this.answer.set(resp);
    } finally {
      this.loading.set(false);
    }
  }

  insightBorderColor(sev: Insight['sev']): string {
    return (
      {
        critical: '#dc2626',
        high: '#d97706',
        medium: '#2563eb',
        info: '#059669',
      }[sev] ?? '#9590b8'
    );
  }

  takeAction(ins: Insight): void {
    this.toast.show(`Action taken: ${ins.action}`, 'info');
  }

  openCreateProcess(): void {
    this.ctx.openModal({
      type: 'createProcess',
      sites: this.data.mySites(),
      onSubmit: (payload) => this.addProcess(payload as CreateProcessPayload),
    });
  }

  addProcess(payload: CreateProcessPayload): void {
    this.data.createProcess(payload);
  }

  toggleProcess(id: number): void {
    this.data.toggleProcess(id);
  }

  runProcess(proc: Process): void {
    this.toast.show(`Running "${proc.name}"…`, 'info');
    setTimeout(() => this.toast.success(`"${proc.name}" completed successfully`), 2200);
  }

  editProcess(proc: Process): void {
    this.toast.show(`Edit "${proc.name}" — coming in full version`, 'info');
  }
}
