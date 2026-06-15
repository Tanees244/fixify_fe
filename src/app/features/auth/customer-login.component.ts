import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppContextService } from '../../core/services/app-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-customer-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <a routerLink="/auth" class="auth-back">
          <app-icon name="chevL" [size]="14" /> Back
        </a>

        <div class="auth-brand auth-brand-sm">
          <div class="logo-ic">
            <app-icon name="zap" [size]="18" color="#fff" />
          </div>
          <div>
            <div class="logo-t" style="font-size: 20px">Fix<span>ify</span></div>
            <p class="auth-sub" style="margin-top: 2px">Customer Portal</p>
          </div>
        </div>

        <h2 class="auth-heading">Welcome back</h2>
        <p class="auth-hint">Sign in to manage your websites</p>

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <div class="fld">
            <label for="email">Email</label>
            <input
              id="email"
              class="inp"
              type="email"
              placeholder="sarah@acmecorp.com"
              [(ngModel)]="email"
              name="email"
              autocomplete="email"
            />
          </div>
          <div class="fld">
            <label for="password">Password</label>
            <input
              id="password"
              class="inp"
              type="password"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              autocomplete="current-password"
            />
          </div>

          @if (error()) {
            <p class="auth-error">{{ error() }}</p>
          }

          <button type="submit" class="btn bp auth-submit" [disabled]="submitting()">
            @if (submitting()) {
              <app-icon name="loader" [size]="14" color="#fff" />
              Signing in…
            } @else {
              Sign in
            }
          </button>
        </form>

        <div class="auth-demo">
          <div class="auth-demo-label">Demo credentials</div>
          <div class="auth-demo-row">
            <span>Email</span><code>{{ demoEmail }}</code>
          </div>
          <div class="auth-demo-row">
            <span>Password</span><code>{{ demoPassword }}</code>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CustomerLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  email = 'sarah@acmecorp.com';
  password = '';
  readonly demoEmail = 'sarah@acmecorp.com';
  readonly demoPassword = 'customer123';
  readonly error = signal('');
  readonly submitting = signal(false);

  onSubmit(): void {
    this.error.set('');
    if (!this.email.trim() || !this.password.trim()) {
      this.error.set('Please enter email and password.');
      return;
    }

    this.submitting.set(true);
    const user = this.auth.login(this.email, this.password, 'customer');
    this.submitting.set(false);

    if (!user) {
      this.error.set('Invalid customer credentials.');
      return;
    }

    this.ctx.setMode('customer');
    if (user.customerId) {
      this.ctx.currentCustomerId.set(user.customerId);
    }
    this.router.navigate(['/customer/dashboard']);
  }
}
