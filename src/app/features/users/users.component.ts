import { Component } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CardComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Users</h1>
      <app-card title="User Management">
        <p class="text-gray-600">User management page coming soon...</p>
      </app-card>
    </div>
  `,
})
export class UsersComponent {}
