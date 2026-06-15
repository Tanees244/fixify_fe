import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal-header',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mdl-h">
      <div style="display: flex; align-items: center; gap: 10px">
        @if (icon) {
          <div
            style="width: 34px; height: 34px; border-radius: 9px; background: var(--acl); display: flex; align-items: center; justify-content: center"
          >
            <app-icon [name]="icon" [size]="16" color="var(--acc)" />
          </div>
        }
        <span class="mdl-title">{{ title }}</span>
      </div>
      <div class="close-btn" (click)="closed.emit()">
        <app-icon name="x" [size]="16" />
      </div>
    </div>
  `,
})
export class ModalHeaderComponent {
  @Input() title = '';
  @Input() icon?: string;
  @Output() closed = new EventEmitter<void>();
}
