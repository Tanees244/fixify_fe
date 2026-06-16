import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppContextService } from '../../core/services/app-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand auth-brand-sm">
          <div class="logo-ic">
            <app-icon name="zap" [size]="18" color="#fff" />
          </div>
          <div>
            <div class="logo-t" style="font-size: 20px">Fix<span>ify</span></div>
            <p class="auth-sub" style="margin-top: 2px">Website Care Platform</p>
          </div>
        </div>

        <h2 class="auth-heading">Sign in</h2>
        <p class="auth-hint">Enter your credentials to continue</p>

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <div class="fld">
            <label for="email">Email</label>
            <input
              id="email"
              class="inp"
              type="email"
              placeholder="you@company.com"
              [(ngModel)]="email"
              name="email"
              autocomplete="email"
              required
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
              required
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
      </div>
    </div>
  `,
})
export class AuthLandingComponent {
  private readonly auth = inject(AuthService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal('');
  readonly submitting = signal(false);

  onSubmit(): void {
    this.error.set('');
    if (!this.email.trim() || !this.password.trim()) {
      this.error.set('Please enter email and password.');
      return;
    }

    this.submitting.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.ctx.setMode(user.role);
        if (user.customerId) {
          this.ctx.currentCustomerId.set(user.customerId);
        }
        this.router.navigate([
          user.role === 'admin' ? '/admin/overview' : '/customer/dashboard',
        ]);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err.message || 'Invalid email or password.');
      },
    });
  }
}
