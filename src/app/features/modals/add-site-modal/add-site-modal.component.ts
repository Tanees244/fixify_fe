import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PLATFORMS } from '../../../core/constants/fixify.constants';
import { AddSitePayload, Platform } from '../../../core/models/fixify.models';
import { AuthService } from '../../../core/services/auth.service';
import {
  CustomersDataService,
  DataSessionService,
  SubscriptionsDataService,
} from '../../../core/services/data';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-add-site-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent, ToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header title="Add Website" icon="globe" (closed)="closed.emit()" />
    <div [class]="ui.modalBody">
      <div [class]="ui.wpSteps">
        @for (s of steps; track s.n) {
          <div
            [class]="
              ui.wpStep +
              (step() >= s.n ? ' ' + ui.wpStepOn : '') +
              (step() === s.n ? ' ' + ui.wpStepActive : '')
            "
          >
            <div [class]="ui.wpStepNum">{{ s.n }}</div>
            <span>{{ s.label }}</span>
          </div>
          @if (s.n < steps.length) {
            <div [class]="ui.wpStepLine + (step() > s.n ? ' ' + ui.wpStepLineOn : '')"></div>
          }
        }
      </div>

      @if (step() === 1) {
        @if (isAdmin()) {
          <div [class]="ui.field">
            <label [class]="ui.label">Customer *</label>
            <select
              [class]="ui.input"
              [ngModel]="customerId()"
              (ngModelChange)="customerId.set($event)"
            >
              <option value="">Select a customer…</option>
              @for (c of customers(); track c.id) {
                <option [value]="c.id">{{ c.company || c.name }} — {{ c.email }}</option>
              }
            </select>
          </div>
        }
        <div [class]="ui.field">
          <label [class]="ui.label">Platform</label>
          <select
            [class]="ui.input"
            [ngModel]="platform()"
            (ngModelChange)="platform.set($event)"
          >
            @for (p of platforms; track p.id) {
              <option [value]="p.id">{{ p.label }}</option>
            }
          </select>
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Website URL *</label>
          <input
            [class]="ui.input"
            placeholder="https://yourwebsite.com"
            [ngModel]="url()"
            (ngModelChange)="url.set($event)"
          />
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Display Name</label>
          <input
            [class]="ui.input"
            placeholder="e.g. My Online Store"
            [ngModel]="siteName()"
            (ngModelChange)="siteName.set($event)"
          />
        </div>
        @if (selectedPlatform(); as pl) {
          <div
            [style.background]="pl.bg"
            [style.border]="'1px solid ' + pl.color + '40'"
            class="rounded-[10px] p-3 text-[13px] leading-relaxed text-fixify-text-2"
          >
            <strong [style.color]="pl.color">{{ pl.label }} monitoring:</strong>
            {{ pl.desc }}
          </div>
        }
      }

      @if (step() === 2) {
        <div [class]="ui.field">
          <label [class]="ui.label">Plan</label>
          <select [class]="ui.input" [ngModel]="plan()" (ngModelChange)="plan.set($event)">
            @for (p of plans(); track p.id) {
              <option [value]="p.id">{{ p.name }} — {{ p.priceLabel }}</option>
            }
          </select>
        </div>
        @if (selectedPlanFeatures().length) {
          <div class="mb-4 text-[12.5px] leading-relaxed text-fixify-text-3">
            @for (feat of selectedPlanFeatures(); track feat) {
              <div>✓ {{ feat }}</div>
            }
          </div>
        }
        @if (platform() === 'wordpress') {
          <div class="flex flex-col gap-1">
            <div [class]="ui.wpToggleRow">
              <div>
                <div class="text-[13.5px] font-medium">Plugin health scanning</div>
                <div class="mt-0.5 text-[11.5px] text-fixify-text-3">
                  Monitor active plugins for vulnerabilities
                </div>
              </div>
              <app-toggle
                [checked]="enablePluginScan()"
                (toggled)="enablePluginScan.set($event)"
              />
            </div>
            <div [class]="ui.wpToggleRow">
              <div>
                <div class="text-[13.5px] font-medium">Auto-update notifications</div>
                <div class="mt-0.5 text-[11.5px] text-fixify-text-3">
                  Alert when WordPress core or plugins need updates
                </div>
              </div>
              <app-toggle
                [checked]="enableAutoUpdates()"
                (toggled)="enableAutoUpdates.set($event)"
              />
            </div>
          </div>
        }
      }

      @if (step() === 3) {
        <div [class]="ui.wpSummary">
          <div class="mb-3 text-[13px] font-semibold text-fixify-text-1">Website summary</div>
          <div [class]="ui.wpSummaryGrid">
            @if (isAdmin()) {
              <div [class]="ui.wpSummaryItem">
                <span [class]="ui.wpSummaryLabel">Customer</span>
                <span [class]="ui.wpSummaryValue">{{ customerLabel() }}</span>
              </div>
            }
            <div [class]="ui.wpSummaryItem">
              <span [class]="ui.wpSummaryLabel">Platform</span>
              <span [class]="ui.wpSummaryValue">{{ selectedPlatform()?.label }}</span>
            </div>
            <div [class]="ui.wpSummaryItem">
              <span [class]="ui.wpSummaryLabel">Site name</span>
              <span [class]="ui.wpSummaryValue">{{ siteName() || '—' }}</span>
            </div>
            <div [class]="ui.wpSummaryItem">
              <span [class]="ui.wpSummaryLabel">Site URL</span>
              <span [class]="ui.wpSummaryValue + ' ' + ui.wpMono">{{ url() || '—' }}</span>
            </div>
            <div [class]="ui.wpSummaryItem">
              <span [class]="ui.wpSummaryLabel">Plan</span>
              <span [class]="ui.wpSummaryValue">{{ planLabel() }}</span>
            </div>
            @if (platform() === 'wordpress') {
              <div [class]="ui.wpSummaryItem">
                <span [class]="ui.wpSummaryLabel">Plugin scan</span>
                <span [class]="ui.wpSummaryValue">{{
                  enablePluginScan() ? 'Enabled' : 'Disabled'
                }}</span>
              </div>
              <div [class]="ui.wpSummaryItem">
                <span [class]="ui.wpSummaryLabel">Auto-update alerts</span>
                <span [class]="ui.wpSummaryValue">{{
                  enableAutoUpdates() ? 'Enabled' : 'Disabled'
                }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()">Cancel</button>
      @if (step() > 1) {
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnGhost"
          style="margin-right: auto"
          (click)="step.set(step() - 1)"
        >
          <app-icon name="chevL" [size]="13" /> Back
        </button>
      }
      @if (step() < 3) {
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnPrimary"
          [disabled]="step() === 1 && !canContinueStep1()"
          (click)="step.set(step() + 1)"
        >
          <app-icon name="chevR" [size]="13" color="#fff" /> Continue
        </button>
      } @else {
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnPrimary"
          [disabled]="!canContinueStep1()"
          (click)="submit()"
        >
          <app-icon name="plus" [size]="13" color="#fff" /> Add Website
        </button>
      }
    </div>
  `,
})
export class AddSiteModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<AddSitePayload>();

  private readonly auth = inject(AuthService);
  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);

  readonly ui = tw;
  readonly step = signal(1);
  readonly platform = signal('wordpress');
  readonly url = signal('');
  readonly siteName = signal('');
  readonly plan = signal('free');
  readonly enablePluginScan = signal(true);
  readonly enableAutoUpdates = signal(false);
  readonly customerId = signal<number | ''>('');

  readonly platforms = PLATFORMS;
  readonly steps = [
    { n: 1, label: 'Site details' },
    { n: 2, label: 'Plan & monitoring' },
    { n: 3, label: 'Review' },
  ];

  readonly isAdmin = computed(() => this.auth.user()?.role === 'admin');
  readonly customers = computed(() => {
    this.session.dataRevision();
    return this.customersData.customers;
  });
  readonly plans = computed(() => {
    this.session.dataRevision();
    return this.subscriptionsData.subscriptionPlans;
  });

  constructor() {
    if (this.isAdmin() && this.customersData.customers.length === 0) {
      this.customersData.fetchClients();
    }
  }

  selectedPlatform(): Platform | undefined {
    return PLATFORMS.find((p) => p.id === this.platform());
  }

  selectedPlanFeatures(): string[] {
    return this.subscriptionsData.getPlan(this.plan())?.features ?? [];
  }

  planLabel(): string {
    return this.subscriptionsData.planLabel(this.plan());
  }

  customerLabel(): string {
    const c = this.customers().find((x) => x.id === Number(this.customerId()));
    return c ? `${c.company || c.name} — ${c.email}` : '—';
  }

  canContinueStep1(): boolean {
    if (!this.url().trim()) return false;
    if (this.isAdmin() && !this.customerId()) return false;
    return true;
  }

  submit(): void {
    if (!this.canContinueStep1()) return;
    const isWp = this.platform() === 'wordpress';
    const url = this.url().trim();
    const name = this.siteName().trim();
    this.submitted.emit({
      url,
      name: name || undefined,
      plan: this.plan(),
      type: this.platform() === 'custom' ? 'custom' : 'cms',
      platform: this.platform(),
      wordpress: isWp
        ? {
            siteName: name,
            siteUrl: url,
            enablePluginScan: this.enablePluginScan(),
            enableAutoUpdates: this.enableAutoUpdates(),
          }
        : undefined,
      custId: this.isAdmin() && this.customerId() ? Number(this.customerId()) : undefined,
    });
  }
}
