import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="ui.tog + ' ' + (checked ? ui.togOn : ui.togOff)"
      role="switch"
      [attr.aria-checked]="checked"
      tabindex="0"
      (click)="onToggle()"
      (keydown.enter)="onToggle()"
      (keydown.space)="$event.preventDefault(); onToggle()"
    >
      <div [class]="ui.togKnob + (checked ? ' ' + ui.togKnobOn : '')"></div>
    </div>
  `,
})
export class ToggleComponent {
  protected readonly ui = tw;

  @Input() checked = false;
  @Output() toggled = new EventEmitter<boolean>();

  onToggle(): void {
    this.toggled.emit(!this.checked);
  }
}
