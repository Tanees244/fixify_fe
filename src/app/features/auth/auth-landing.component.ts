import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card auth-card-lg">
        <div class="auth-brand">
          <div class="logo-ic">
            <app-icon name="zap" [size]="22" color="#fff" />
          </div>
          <h1 class="logo-t">Fix<span>ify</span></h1>
          <p class="auth-sub">Website Care Platform</p>
        </div>

        <p class="auth-lead">Choose how you want to sign in</p>

        <div class="auth-portal-grid">
          <a routerLink="/auth/customer/login" class="auth-portal-card">
            <div class="auth-portal-icon" style="background: var(--acl); color: var(--acc)">
              <app-icon name="globe" [size]="28" color="var(--acc)" />
            </div>
            <div class="auth-portal-title">Customer Portal</div>
            <div class="auth-portal-desc">
              Monitor your websites, tickets, performance & AI insights
            </div>
            <span class="auth-portal-cta">
              Sign in as Customer
              <app-icon name="chevR" [size]="14" color="var(--acc)" />
            </span>
          </a>

          <a routerLink="/auth/admin/login" class="auth-portal-card">
            <div class="auth-portal-icon" style="background: #f0fdf4; color: #059669">
              <app-icon name="shield" [size]="28" color="#059669" />
            </div>
            <div class="auth-portal-title">Admin Console</div>
            <div class="auth-portal-desc">
              Manage customers, all websites, tickets & platform settings
            </div>
            <span class="auth-portal-cta" style="color: #059669">
              Sign in as Admin
              <app-icon name="chevR" [size]="14" color="#059669" />
            </span>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class AuthLandingComponent {}
