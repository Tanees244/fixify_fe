import { Component, inject } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CardComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Profile</h1>
      @if (user) {
        <app-card title="User Information">
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-500">Email</label>
              <p class="text-gray-800">{{ user.email }}</p>
            </div>
            @if (user.name) {
              <div>
                <label class="text-sm font-medium text-gray-500">Name</label>
                <p class="text-gray-800">{{ user.name }}</p>
              </div>
            }
            @if (user.roles && user.roles.length > 0) {
              <div>
                <label class="text-sm font-medium text-gray-500">Roles</label>
                <p class="text-gray-800">{{ user.roles.join(', ') }}</p>
              </div>
            }
          </div>
        </app-card>
      }
    </div>
  `,
})
export class ProfileComponent {
  private authService = inject(AuthService);
  user = this.authService.getCurrentUser();
}
