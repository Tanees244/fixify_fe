import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-modal-header',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.modalHeader">
      <div class="flex items-center gap-2.5">
        @if (icon) {
          <div [class]="ui.iconBadge">
            <app-icon [name]="icon" [size]="16" color="#1d6fe0" />
          </div>
        }
        <span [class]="ui.modalTitle">{{ title }}</span>
      </div>
      <button type="button" [class]="ui.closeBtn" (click)="closed.emit()">
        <app-icon name="x" [size]="16" />
      </button>
    </div>
  `,
})
export class ModalHeaderComponent {
  @Input() title = '';
  @Input() icon?: string;
  @Output() closed = new EventEmitter<void>();

  readonly ui = tw;
}
