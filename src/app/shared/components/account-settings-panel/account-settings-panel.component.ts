import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../icon/icon.component';
import { tw } from '../../ui/tw';

interface ProfileDisplay {
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
}

@Component({
  selector: 'app-account-settings-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  template: `
    <div [class]="ui.card + ' ' + ui.cardPad + ' ' + ui.cardHover">
      <div [class]="ui.sectionTitle" style="margin-bottom: 14px">Account</div>

      @if (loading()) {
        <div [class]="ui.skelCell" style="height: 12px; width: 55%; margin-bottom: 14px"></div>
        <div [class]="ui.skelCell" style="height: 36px; width: 100%; margin-bottom: 12px"></div>
        <div [class]="ui.skelCell" style="height: 36px; width: 100%; margin-bottom: 12px"></div>
        <div [class]="ui.skelCell" style="height: 36px; width: 70%"></div>
      } @else if (error()) {
        <p style="color: var(--er); font-size: 13px; margin-bottom: 12px">{{ error() }}</p>
        <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="loadProfile()">Retry</button>
      } @else {
        @if (profile(); as p) {
          <div [class]="ui.fld">
            <label [class]="ui.label">Full Name</label>
            <input [class]="ui.input" [ngModel]="p.name" readonly />
          </div>
          <div [class]="ui.fld">
            <label [class]="ui.label">Email</label>
            <input [class]="ui.input" [ngModel]="p.email" readonly disabled />
          </div>
          <div [class]="ui.fld">
            <label [class]="ui.label">Company</label>
            <input [class]="ui.input" [ngModel]="p.company || '—'" readonly />
          </div>
          @if (p.phone) {
            <div [class]="ui.fld">
              <label [class]="ui.label">Phone</label>
              <input [class]="ui.input" [ngModel]="p.phone" readonly />
            </div>
          }
          <div [class]="ui.fld">
            <label [class]="ui.label">Role</label>
            <input [class]="ui.input" [ngModel]="p.role" readonly />
          </div>
        }
      }

      <div style="margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--b2)">
        <div [class]="ui.sectionTitle" style="margin-bottom: 12px; font-size: 14px">Change Password</div>
        <div [class]="ui.fld">
          <label [class]="ui.label">Current password</label>
          <div [class]="ui.wpPasswordWrap">
            <input
              [class]="ui.input"
              [type]="showCurrentPassword() ? 'text' : 'password'"
              autocomplete="current-password"
              [ngModel]="currentPassword()"
              (ngModelChange)="currentPassword.set($event)"
            />
            <button
              type="button"
              [class]="ui.wpPasswordToggle"
              (click)="showCurrentPassword.set(!showCurrentPassword())"
            >
              <app-icon [name]="showCurrentPassword() ? 'eye' : 'lock'" [size]="15" color="var(--t3)" />
            </button>
          </div>
        </div>
        <div [class]="ui.grid2">
          <div [class]="ui.fld">
            <label [class]="ui.label">New password</label>
            <input
              [class]="ui.input"
              [type]="showNewPassword() ? 'text' : 'password'"
              autocomplete="new-password"
              [ngModel]="newPassword()"
              (ngModelChange)="newPassword.set($event)"
            />
          </div>
          <div [class]="ui.fld">
            <label [class]="ui.label">Confirm new password</label>
            <input
              [class]="ui.input"
              [type]="showNewPassword() ? 'text' : 'password'"
              autocomplete="new-password"
              [ngModel]="confirmPassword()"
              (ngModelChange)="confirmPassword.set($event)"
            />
          </div>
        </div>
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnPrimary"
          style="margin-top: 6px"
          [disabled]="changingPassword() || !canChangePassword()"
          (click)="submitChangePassword()"
        >
          @if (changingPassword()) {
            <app-icon name="loader" [size]="13" color="#fff" />
            Updating…
          } @else {
            Update Password
          }
        </button>
      </div>
    </div>
  `,
})
export class AccountSettingsPanelComponent {
  protected readonly ui = tw;

  private readonly auth = inject(AuthService);
  private readonly toast = inject(NotificationService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly profile = signal<ProfileDisplay | null>(null);
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly changingPassword = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.fetchProfile().subscribe({
      next: (user) => {
        this.profile.set({
          name: user.name,
          email: user.email,
          company: user.companyName ?? '',
          phone: user.phone ?? '',
          role: user.role.toLowerCase() === 'admin' ? 'Administrator' : 'Customer',
        });
        this.auth.syncUserFromProfile(user);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  canChangePassword(): boolean {
    return (
      this.currentPassword().trim().length > 0 &&
      this.newPassword().trim().length >= 6 &&
      this.newPassword() === this.confirmPassword()
    );
  }

  submitChangePassword(): void {
    if (!this.canChangePassword() || this.changingPassword()) return;

    this.changingPassword.set(true);
    this.auth
      .changePassword(this.currentPassword().trim(), this.newPassword().trim())
      .subscribe({
        next: (message) => {
          this.toast.success(message);
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
          this.changingPassword.set(false);
        },
        error: (err: Error) => {
          this.toast.error(err.message);
          this.changingPassword.set(false);
        },
      });
  }
}
