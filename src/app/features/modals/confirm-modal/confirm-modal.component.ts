import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header [title]="title" (closed)="closed.emit()" />
    <div [class]="ui.modalBody">
      <p class="text-sm leading-relaxed text-fixify-text-2">{{ body }}</p>
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        [class]="ui.btn + ' ' + (danger ? ui.btnDanger : ui.btnPrimary)"
        (click)="confirmed.emit()"
      >
        @if (danger) {
          <app-icon name="trash" [size]="13" color="#dc2626" />
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

  readonly ui = tw;
}
