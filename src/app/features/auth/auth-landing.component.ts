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
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { tw } from '../../shared/ui/tw';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.authPage">
      <div [class]="ui.authCard">
        <div [class]="ui.authBrand">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <img src="/favicon.png" alt="Fixify" width="40" height="40" />
          </div>
          <div>
            <div class="text-xl font-bold tracking-tight text-fixify-text-1">
              Fix<span class="text-fixify-accent">ify</span>
            </div>
            <p [class]="ui.authSub">Website Care Platform</p>
          </div>
        </div>

        <h2 [class]="ui.authHeading">Sign in</h2>
        <p [class]="ui.authHint">Enter your credentials to continue</p>

        <form [class]="ui.authForm" (ngSubmit)="onSubmit()">
          <div [class]="ui.field">
            <label [class]="ui.label" for="email">Email</label>
            <input
              id="email"
              [class]="ui.input"
              type="email"
              placeholder="you@company.com"
              [(ngModel)]="email"
              name="email"
              autocomplete="email"
              required
            />
          </div>
          <div [class]="ui.field">
            <div class="flex items-center justify-between">
              <label [class]="ui.label" for="password">Password</label>
              <a routerLink="/auth/forgot-password" [class]="ui.authLink">Forgot password?</a>
            </div>
            <div [class]="ui.passwordWrap">
              <input
                id="password"
                [class]="ui.input + ' pr-10'"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="••••••••"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                [class]="ui.passwordToggle"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                <app-icon [name]="showPassword() ? 'eye' : 'lock'" [size]="15" color="#6b88ad" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            [class]="ui.btn + ' ' + ui.btnPrimary + ' ' + ui.btnFull"
            [disabled]="submitting()"
          >
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
  private readonly toast = inject(NotificationService);

  readonly ui = tw;
  email = '';
  password = '';
  readonly showPassword = signal(false);
  readonly submitting = signal(false);

  onSubmit(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.toast.error('Please enter email and password.');
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
        this.toast.error(err.message || 'Incorrect email or password.');
      },
    });
  }
}
