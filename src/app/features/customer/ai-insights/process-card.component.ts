import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Process } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-process-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, ToggleComponent],
  templateUrl: './process-card.component.html',
})
export class ProcessCardComponent {
  protected readonly ui = tw;

  @Input({ required: true }) proc!: Process;
  @Output() toggle = new EventEmitter<number>();
  @Output() run = new EventEmitter<Process>();
  @Output() edit = new EventEmitter<Process>();

  get successPct(): number {
    return Math.round((this.proc.success / Math.max(this.proc.runs, 1)) * 100);
  }

  get sitesLabel(): string {
    return this.proc.sites[0] === 'all' ? 'All Sites' : this.proc.sites.join(', ');
  }

  onToggle(): void {
    this.toggle.emit(this.proc.id);
  }
}
