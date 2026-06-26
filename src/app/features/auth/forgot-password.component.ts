import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { tw } from '../../shared/ui/tw';

type ResetStep = 'email' | 'verify';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.authPage">
      <div [class]="ui.authCard">
        <a routerLink="/auth" [class]="ui.authBack">
          <app-icon name="chevL" [size]="13" />
          Back to sign in
        </a>

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

        @if (step() === 'email') {
          <h2 [class]="ui.authHeading">Forgot password</h2>
          <p [class]="ui.authHint">Enter your email and we'll send you a one-time code.</p>

          <form [class]="ui.authForm" (ngSubmit)="sendOtp()">
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

            @if (error()) {
              <p [class]="ui.authError">{{ error() }}</p>
            }
            @if (success()) {
              <p [class]="ui.authSuccess">{{ success() }}</p>
            }

            <button
              type="submit"
              [class]="ui.btn + ' ' + ui.btnPrimary + ' ' + ui.btnFull"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <app-icon name="loader" [size]="14" color="#fff" />
                Sending…
              } @else {
                Send reset code
              }
            </button>
          </form>
        } @else {
          <h2 [class]="ui.authHeading">Reset password</h2>
          <p [class]="ui.authHint">
            Enter the OTP sent to <strong class="text-fixify-text-2">{{ email }}</strong> and choose a new password.
          </p>

          <form [class]="ui.authForm" (ngSubmit)="resetPassword()">
            <div [class]="ui.field">
              <label [class]="ui.label" for="otp">One-time code</label>
              <input
                id="otp"
                [class]="ui.input"
                type="text"
                inputmode="numeric"
                placeholder="6-digit code"
                [(ngModel)]="otp"
                name="otp"
                autocomplete="one-time-code"
                required
              />
            </div>
            <div [class]="ui.field">
              <label [class]="ui.label" for="newPassword">New password</label>
              <div [class]="ui.passwordWrap">
                <input
                  id="newPassword"
                  [class]="ui.input + ' pr-10'"
                  [type]="showPassword() ? 'text' : 'password'"
                  placeholder="Enter new password"
                  [(ngModel)]="password"
                  name="newPassword"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  [class]="ui.passwordToggle"
                  (click)="showPassword.set(!showPassword())"
                >
                  <app-icon [name]="showPassword() ? 'eye' : 'lock'" [size]="15" color="#6b88ad" />
                </button>
              </div>
            </div>
            <div [class]="ui.field">
              <label [class]="ui.label" for="confirmPassword">Confirm password</label>
              <div [class]="ui.passwordWrap">
                <input
                  id="confirmPassword"
                  [class]="ui.input + ' pr-10'"
                  [type]="showConfirm() ? 'text' : 'password'"
                  placeholder="Confirm new password"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  [class]="ui.passwordToggle"
                  (click)="showConfirm.set(!showConfirm())"
                >
                  <app-icon [name]="showConfirm() ? 'eye' : 'lock'" [size]="15" color="#6b88ad" />
                </button>
              </div>
            </div>

            @if (error()) {
              <p [class]="ui.authError">{{ error() }}</p>
            }

            <button
              type="submit"
              [class]="ui.btn + ' ' + ui.btnPrimary + ' ' + ui.btnFull"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <app-icon name="loader" [size]="14" color="#fff" />
                Resetting…
              } @else {
                Reset password
              }
            </button>

            <button
              type="button"
              [class]="ui.btn + ' ' + ui.btnGhost + ' ' + ui.btnFull"
              [disabled]="submitting()"
              (click)="step.set('email')"
            >
              Use a different email
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  readonly ui = tw;
  readonly step = signal<ResetStep>('email');
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  email = '';
  otp = '';
  password = '';
  confirmPassword = '';

  sendOtp(): void {
    this.error.set('');
    this.success.set('');
    if (!this.email.trim()) {
      this.error.set('Please enter your email.');
      return;
    }

    this.submitting.set(true);
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (message) => {
        this.submitting.set(false);
        this.success.set(message);
        this.toast.success(message);
        this.step.set('verify');
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }

  resetPassword(): void {
    this.error.set('');
    if (!this.otp.trim() || !this.password.trim()) {
      this.error.set('Please enter the OTP and new password.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.auth.verifyResetPassword(this.email.trim(), this.otp.trim(), this.password).subscribe({
      next: (message) => {
        this.submitting.set(false);
        this.toast.success(message);
        this.router.navigate(['/auth']);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }
}
