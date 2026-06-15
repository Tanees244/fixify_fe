import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header [title]="title" (closed)="closed.emit()" />
    <div class="mdl-b">
      <p style="font-size: 14px; color: var(--t2); line-height: 1.65">{{ body }}</p>
    </div>
    <div class="mdl-f">
      <button type="button" class="btn bg" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        [class]="danger ? 'btn bd2' : 'btn bp'"
        (click)="confirmed.emit()"
      >
        @if (danger) {
          <app-icon name="trash" [size]="13" color="var(--er)" />
          Delete
        } @else {
          <app-icon name="check" [size]="13" color="#fff" />
          Confirm
        }
      </button>
    </div>
  `,
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm';
  @Input() body = '';
  @Input() danger = false;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}
