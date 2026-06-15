import { Component } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CardComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <app-card title="Application Settings">
        <p class="text-gray-600">Settings page coming soon...</p>
      </app-card>
    </div>
  `,
})
export class SettingsComponent {}
