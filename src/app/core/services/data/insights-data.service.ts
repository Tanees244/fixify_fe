import { Injectable, inject } from '@angular/core';
import { CreateProcessPayload, Insight, Process } from '../../models/fixify.models';
import { AI_RESPONSES, AI_SUGGESTIONS } from '../../constants/fixify.constants';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { buildTriggerDetail, delay } from './data.utils';

@Injectable({ providedIn: 'root' })
export class InsightsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);

  readonly insights: Insight[] = [];
  readonly processes: Process[] = [];

  private nextProcessId = 100;

  getInsights(): Insight[] {
    return this.insights;
  }

  async askAi(question: string): Promise<string> {
    await delay(1400);
    const key =
      AI_SUGGESTIONS.find((s) => question.includes(s.slice(0, 10))) ?? question;
    return (
      AI_RESPONSES[key] ??
      `Analyzing your websites...\n\nBased on current data across your monitored sites, here is what I found regarding "${question}":\n\nWould you like me to generate a detailed action plan?`
    );
  }

  createProcess(data: CreateProcessPayload): void {
    const process: Process = {
      id: this.nextProcessId++,
      name: data.name,
      desc: data.desc || data.name,
      trigger: data.trigger,
      triggerDetail: buildTriggerDetail(data.trigger, data.day, data.time),
      sites: data.targetSites === 'all' ? ['all'] : [data.targetSites],
      actions: data.actions,
      enabled: true,
      lastRun: 'Never',
      nextRun: 'Scheduled',
      runs: 0,
      success: 0,
      custId: this.ctx.currentCustomerId(),
    };
    this.processes.unshift(process);
    this.toast.success(`Process "${process.name}" created`);
  }

  toggleProcess(id: number): void {
    const idx = this.processes.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.processes[idx] = {
        ...this.processes[idx],
        enabled: !this.processes[idx].enabled,
      };
    }
  }
}
