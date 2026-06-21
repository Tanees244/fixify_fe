import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PLATFORMS } from '../../../core/constants/fixify.constants';
import { AddSitePayload, Platform } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-add-site-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      [title]="stepTitle()"
      icon="globe"
      (closed)="closed.emit()"
    />
    <div [class]="ui.modalBody">
      @if (step() === 1) {
        <p class="mb-[18px] text-[13.5px] leading-relaxed text-fixify-text-2">
          What kind of website are you adding? This determines which monitoring
          modules we activate.
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
          @for (t of siteTypes; track t.id) {
            <div
              (click)="siteType.set(t.id)"
              [style.border]="
                '2px solid ' +
                (siteType() === t.id ? t.color : 'var(--bd)')
              "
              style="border-radius: 14px; padding: 22px 18px; cursor: pointer; transition: all 0.18s; text-align: center"
              [style.background]="
                siteType() === t.id ? t.color + '0f' : 'var(--sr)'
              "
            >
              <div
                [style.background]="
                  siteType() === t.id ? t.color : t.color + '18'
                "
                style="width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; transition: background 0.18s"
              >
                <app-icon
                  [name]="t.icon"
                  [size]="24"
                  [color]="siteType() === t.id ? '#fff' : t.color"
                />
              </div>
              <div class="mb-[7px] text-[15px] font-bold text-fixify-text-1">
                {{ t.label }}
              </div>
              <div class="text-[12.5px] leading-snug text-fixify-text-3">
                {{ t.desc }}
              </div>
              @if (siteType() === t.id) {
                <div
                  style="margin-top: 12px; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600"
                  [style.color]="t.color"
                >
                  <app-icon name="check" [size]="12" [color]="t.color" />
                  Selected
                </div>
              }
            </div>
          }
        </div>
      }

      @if (step() === 2) {
        <p class="mb-4 text-[13.5px] leading-relaxed text-fixify-text-2">
          Select your platform to unlock tailored monitoring, plugin health
          checks, and automation templates.
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          @for (p of cmsPlatforms; track p.id) {
            <div
              (click)="platform.set(p.id)"
              [style.border]="
                '2px solid ' + (platform() === p.id ? p.color : 'var(--bd)')
              "
              [style.background]="platform() === p.id ? p.bg : 'var(--sr)'"
              style="border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 10px"
            >
              <div
                [style.background]="p.color"
                style="width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0"
              >
                <span style="color: #fff; font-weight: 800; font-size: 11px">{{
                  p.label.slice(0, 2).toUpperCase()
                }}</span>
              </div>
              <div style="flex: 1; min-width: 0">
                <div class="text-[13.5px] font-bold text-fixify-text-1">
                  {{ p.label }}
                </div>
                <div class="mt-0.5 truncate text-[11px] text-fixify-text-3">
                  {{ p.desc }}
                </div>
              </div>
              @if (platform() === p.id) {
                <app-icon name="check" [size]="14" [color]="p.color" />
              }
            </div>
          }
        </div>
      }

      @if (step() === 3) {
        @if (selectedPlatform(); as pl) {
          @if (pl.id !== 'custom') {
            <div
              [style.background]="pl.bg"
              [style.border]="'1px solid ' + pl.color + '40'"
              style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px"
            >
              <div
                [style.background]="pl.color"
                style="width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0"
              >
                <span style="color: #fff; font-weight: 800; font-size: 11px">{{
                  pl.label.slice(0, 2).toUpperCase()
                }}</span>
              </div>
              <div>
                <div class="text-[13px] font-semibold text-fixify-text-1">
                  {{ pl.label }} Site
                </div>
                <div class="mt-px text-[11.5px] text-fixify-text-3">
                  {{ pl.desc }}
                </div>
              </div>
            </div>
          }
        }
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
        <div [class]="ui.field">
          <label [class]="ui.label">Plan</label>
          <select [class]="ui.input" [ngModel]="plan()" (ngModelChange)="plan.set($event)">
            <option>Starter</option>
            <option>Pro</option>
            <option>Business</option>
            <option>Enterprise</option>
          </select>
        </div>
        <div
          class="rounded-[10px] border border-fixify-accent-mid bg-fixify-accent-soft p-3 text-[13px] leading-relaxed text-fixify-text-2"
        >
          <strong class="text-fixify-accent">Monitoring activated:</strong>
          Performance · Security · SEO · Uptime
          @if (siteType() === 'cms' && selectedPlatform(); as pl) {
            <span [style.color]="pl.color">
              · {{ pl.label }} plugin health · Core updates · Theme checks
            </span>
          }
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
      @if (step() === 1) {
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnPrimary"
          [disabled]="!siteType()"
          (click)="onStep1Continue()"
        >
          <app-icon name="chevR" [size]="13" color="#fff" /> Continue
        </button>
      }
      @if (step() === 2) {
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnPrimary"
          [disabled]="!platform()"
          (click)="step.set(3)"
        >
          <app-icon name="chevR" [size]="13" color="#fff" /> Continue
        </button>
      }
      @if (step() === 3) {
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnPrimary"
          [disabled]="!url()"
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

  readonly ui = tw;
  readonly step = signal(1);
  readonly siteType = signal('');
  readonly platform = signal('');
  readonly url = signal('');
  readonly siteName = signal('');
  readonly plan = signal('Pro');

  readonly cmsPlatforms = PLATFORMS.filter((p) => p.id !== 'custom');

  readonly siteTypes = [
    {
      id: 'custom',
      label: 'Custom Website',
      icon: 'globe',
      color: 'var(--acc)',
      desc: 'React, Next.js, Vue, plain HTML — any custom-built site without a CMS',
    },
    {
      id: 'cms',
      label: 'CMS / Platform',
      icon: 'layers',
      color: '#059669',
      desc: 'WordPress, Shopify, Wix, Squarespace, Webflow, Magento & more',
    },
  ];

  stepTitle(): string {
    if (this.step() === 1) return 'Choose Website Type';
    if (this.step() === 2) return 'Select Your Platform';
    return 'Configure Your Website';
  }

  selectedPlatform(): Platform | undefined {
    return (
      PLATFORMS.find((p) => p.id === this.platform()) ??
      PLATFORMS.find((p) => p.id === 'custom')
    );
  }

  onStep1Continue(): void {
    this.step.set(this.siteType() === 'cms' ? 2 : 3);
  }

  submit(): void {
    this.submitted.emit({
      url: this.url(),
      name: this.siteName() || undefined,
      plan: this.plan(),
      type: this.siteType(),
      platform:
        this.siteType() === 'cms' ? this.platform() : 'custom',
    });
  }
}
