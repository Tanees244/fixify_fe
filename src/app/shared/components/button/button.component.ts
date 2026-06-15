import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [type]="buttonType"
      [ngClass]="
        type === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition'
          : 'bg-gray-200 text-black hover:bg-gray-300 px-4 py-2 rounded-lg transition'
      "
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() type: 'primary' | 'secondary' = 'primary';
  @Input() buttonType: 'button' | 'submit' | 'reset' = 'button';
}
