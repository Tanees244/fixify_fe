import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tog"
      [class.on]="checked"
      [class.off]="!checked"
      role="switch"
      [attr.aria-checked]="checked"
      tabindex="0"
      (click)="onToggle()"
      (keydown.enter)="onToggle()"
      (keydown.space)="$event.preventDefault(); onToggle()"
    ></div>
  `,
})
export class ToggleComponent {
  @Input() checked = false;
  @Output() toggled = new EventEmitter<boolean>();

  onToggle(): void {
    this.toggled.emit(!this.checked);
  }
}
