import { Component } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <app-card title="Welcome">
          <p class="text-gray-600">You are logged in. This is a protected route.</p>
        </app-card>
        <app-card title="Quick actions">
          <p class="text-gray-600">Add your dashboard widgets and links here.</p>
        </app-card>
        <app-card title="Stats">
          <p class="text-gray-600">Place charts or KPIs in this card.</p>
        </app-card>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  // Logout is now handled in navbar
}
