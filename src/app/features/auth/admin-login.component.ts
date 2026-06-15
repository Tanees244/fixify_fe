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
  selector: 'app-admin-login',
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
          <div class="logo-ic" style="background: #059669">
            <app-icon name="shield" [size]="18" color="#fff" />
          </div>
          <div>
            <div class="logo-t" style="font-size: 20px">Fix<span>ify</span></div>
            <p class="auth-sub" style="margin-top: 2px">Admin Console</p>
          </div>
        </div>

        <h2 class="auth-heading">Admin sign in</h2>
        <p class="auth-hint">Platform management & customer oversight</p>

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <div class="fld">
            <label for="email">Email</label>
            <input
              id="email"
              class="inp"
              type="email"
              placeholder="admin@fixify.com"
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

          <button type="submit" class="btn bp auth-submit" style="background: #059669; box-shadow: 0 2px 8px rgba(5,150,105,.3)" [disabled]="submitting()">
            @if (submitting()) {
              <app-icon name="loader" [size]="14" color="#fff" />
              Signing in…
            } @else {
              Sign in to Admin
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
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  email = 'admin@fixify.com';
  password = '';
  readonly demoEmail = 'admin@fixify.com';
  readonly demoPassword = 'admin123';
  readonly error = signal('');
  readonly submitting = signal(false);

  onSubmit(): void {
    this.error.set('');
    if (!this.email.trim() || !this.password.trim()) {
      this.error.set('Please enter email and password.');
      return;
    }

    this.submitting.set(true);
    const user = this.auth.login(this.email, this.password, 'admin');
    this.submitting.set(false);

    if (!user) {
      this.error.set('Invalid admin credentials.');
      return;
    }

    this.ctx.setMode('admin');
    this.router.navigate(['/admin/overview']);
  }
}
