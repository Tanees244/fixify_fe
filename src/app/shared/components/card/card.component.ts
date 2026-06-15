import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      @if (title) {
        <h2 class="text-lg font-semibold text-gray-800 mb-3">{{ title }}</h2>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  @Input() title = '';
}
