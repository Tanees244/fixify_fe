import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PromotionsApiService } from '../../../core/services/api/promotions-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PromotionsService } from '../../../core/services/promotions.service';
import {
  PROMOTION_THEMES,
  Promotion,
  PromotionInput,
  PromotionKind,
  PromotionTheme,
} from '../../../core/models/promotions.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../shared/ui/tw';

interface Draft {
  id: string | null;
  kind: PromotionKind;
  title: string;
  subtitle: string;
  badge: string;
  ctaLabel: string;
  ctaUrl: string;
  theme: PromotionTheme;
  isActive: boolean;
  sortOrder: number;
  /** yyyy-MM-dd or '' */
  startsAt: string;
  endsAt: string;
}

const blank = (kind: PromotionKind = 'ticker'): Draft => ({
  id: null,
  kind,
  title: '',
  subtitle: '',
  badge: '',
  ctaLabel: '',
  ctaUrl: '',
  theme: kind === 'ticker' ? 'coral' : 'purple',
  isActive: true,
  sortOrder: 0,
  startsAt: '',
  endsAt: '',
});

/** yyyy-MM-dd in the admin's own timezone (the date picker works in local days). */
const toDateInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Admin: add, edit, reorder-by-number, hide and remove the customer top bar and dashboard banners. */
@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, BadgeComponent, TableSkeletonComponent],
  template: `
    <div data-allow>
      <div [class]="ui.pageHeader" style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap">
        <div>
          <div [class]="ui.pageTitle">Promotions</div>
          <div [class]="ui.pageSub">
            Scrolling top-bar messages and dashboard banners shown to every customer.
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-start">
          <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="startNew('ticker')">+ Top-bar message</button>
          <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" (click)="startNew('hero')">+ Dashboard banner</button>
        </div>
      </div>

      <div [class]="ui.card + ' ' + ui.u" style="margin-bottom: 22px; overflow: hidden">
        <div style="padding: 14px 16px 10px; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap">
          <div style="font-weight: 700; font-size: 15px">How customers see it</div>
          <div style="font-size: 12px; color: var(--t3)">Live preview of what is switched on right now</div>
        </div>
        @if (loading()) {
          <div style="padding: 0 16px 16px">
            <div [class]="ui.skelBlock" style="height: 34px; margin-bottom: 12px"></div>
            <div [class]="ui.skelBlock" style="height: 150px"></div>
          </div>
        } @else if (!liveTicker().length && !liveHero().length) {
          <div style="padding: 0 16px 18px; font-size: 13px; color: var(--t3)">
            Nothing is live. Customers see no top bar and no dashboard banner. Add one above to preview it here.
          </div>
        } @else {
          @if (liveTicker().length) {
            <div class="promo-ticker" [attr.data-theme]="liveTicker()[0].theme">
              <div class="promo-track" [style.animation-duration.s]="previewDuration()">
                @for (half of [0, 1]; track half) {
                  <span class="promo-item" [attr.aria-hidden]="half ? 'true' : null">
                    @for (t of liveTicker(); track t.id) {
                      <span>{{ t.title }}</span><span>%</span>
                    }
                  </span>
                }
              </div>
            </div>
          }
          <div style="padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 14px; background: var(--bg)">
            @for (h of liveHero(); track h.id) {
              <section class="promo-hero" [attr.data-theme]="h.theme">
                <h2 class="promo-hero-title">{{ h.title }}</h2>
                @if (h.badge) { <div class="promo-hero-badge">{{ h.badge }}</div> }
                @if (h.subtitle) { <p class="promo-hero-sub">{{ h.subtitle }}</p> }
                @if (h.ctaLabel) { <span class="promo-hero-cta">{{ h.ctaLabel }}</span> }
              </section>
            } @empty {
              <div style="font-size: 12.5px; color: var(--t3)">No dashboard banner is live.</div>
            }
          </div>
        }
      </div>

      @if (draft(); as d) {
        <div [class]="ui.card + ' ' + ui.cardPad + ' ' + ui.u" style="margin-bottom: 22px">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 14px">
            {{ d.id ? 'Edit' : 'New' }} {{ d.kind === 'ticker' ? 'top-bar message' : 'dashboard banner' }}
          </div>

          <div [class]="ui.fld">
            <label [class]="ui.label">{{ d.kind === 'ticker' ? 'Message' : 'Headline' }} *</label>
            <input [class]="ui.input" maxlength="160" [ngModel]="d.title" (ngModelChange)="patch({ title: $event })" />
          </div>

          @if (d.kind === 'hero') {
            <div [class]="ui.grid2">
              <div [class]="ui.fld">
                <label [class]="ui.label">Highlight badge (e.g. 85% OFF)</label>
                <input [class]="ui.input" maxlength="40" [ngModel]="d.badge" (ngModelChange)="patch({ badge: $event })" />
              </div>
              <div [class]="ui.fld">
                <label [class]="ui.label">Sub-text</label>
                <input [class]="ui.input" maxlength="300" [ngModel]="d.subtitle" (ngModelChange)="patch({ subtitle: $event })" />
              </div>
              <div [class]="ui.fld">
                <label [class]="ui.label">Button label</label>
                <input [class]="ui.input" maxlength="40" [ngModel]="d.ctaLabel" (ngModelChange)="patch({ ctaLabel: $event })" />
              </div>
              <div [class]="ui.fld">
                <label [class]="ui.label">Button link (/customer/billing or https://…)</label>
                <input [class]="ui.input" maxlength="500" [ngModel]="d.ctaUrl" (ngModelChange)="patch({ ctaUrl: $event })" />
              </div>
            </div>
          } @else {
            <div [class]="ui.fld">
              <label [class]="ui.label">Link (optional: /customer/billing or https://…)</label>
              <input [class]="ui.input" maxlength="500" [ngModel]="d.ctaUrl" (ngModelChange)="patch({ ctaUrl: $event })" />
            </div>
          }

          <div [class]="ui.grid2">
            <div [class]="ui.fld">
              <label [class]="ui.label">Colour</label>
              <select [class]="ui.input" [ngModel]="d.theme" (ngModelChange)="patch({ theme: $event })">
                @for (t of themes; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
            <div [class]="ui.fld">
              <label [class]="ui.label">Order (lower shows first)</label>
              <input type="number" [class]="ui.input" [ngModel]="d.sortOrder" (ngModelChange)="patch({ sortOrder: +$event || 0 })" />
            </div>
            <div [class]="ui.fld">
              <label [class]="ui.label">Show from (optional)</label>
              <input type="date" [class]="ui.input" [ngModel]="d.startsAt" (ngModelChange)="patch({ startsAt: $event })" />
            </div>
            <div [class]="ui.fld">
              <label [class]="ui.label">Show until (optional)</label>
              <input type="date" [class]="ui.input" [ngModel]="d.endsAt" (ngModelChange)="patch({ endsAt: $event })" />
            </div>
          </div>

          <label style="display: flex; gap: 8px; align-items: center; font-size: 13px; margin-bottom: 14px">
            <input type="checkbox" [ngModel]="d.isActive" (ngModelChange)="patch({ isActive: $event })" />
            Visible to customers
          </label>

          @if (d.kind === 'hero' && d.title.trim()) {
            <div style="margin-bottom: 14px">
              <div [class]="ui.label" style="margin-bottom: 6px">Preview</div>
              <section class="promo-hero" [attr.data-theme]="d.theme">
                <h2 class="promo-hero-title">{{ d.title }}</h2>
                @if (d.badge) { <div class="promo-hero-badge">{{ d.badge }}</div> }
                @if (d.subtitle) { <p class="promo-hero-sub">{{ d.subtitle }}</p> }
                @if (d.ctaLabel) { <span class="promo-hero-cta">{{ d.ctaLabel }}</span> }
              </section>
            </div>
          }
          @if (d.kind === 'ticker' && d.title.trim()) {
            <div style="margin-bottom: 14px">
              <div [class]="ui.label" style="margin-bottom: 6px">Preview</div>
              <div class="promo-ticker" [attr.data-theme]="d.theme" style="border-radius: 8px">
                <div class="promo-track" style="animation-duration: 14s">
                  @for (half of [0, 1]; track half) {
                    <span class="promo-item" [attr.aria-hidden]="half ? 'true' : null">
                      <span>{{ d.title }}</span><span>%</span><span>{{ d.title }}</span><span>✦</span>
                    </span>
                  }
                </div>
              </div>
            </div>
          }

          <div style="display: flex; gap: 10px">
            <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" [disabled]="busy()" (click)="draft.set(null)">Cancel</button>
            <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" [disabled]="busy() || !d.title.trim()" (click)="save()">
              {{ busy() ? 'Saving…' : d.id ? 'Save changes' : 'Add' }}
            </button>
          </div>
        </div>
      }

      @for (section of sections; track section.kind) {
        <div [class]="ui.card + ' ' + ui.u" style="margin-bottom: 22px; overflow-x: auto">
          <div style="padding: 14px 16px; font-weight: 700; font-size: 15px">{{ section.label }}</div>
          <table [class]="ui.table">
            <thead>
              <tr>
                <th [class]="ui.th">{{ section.kind === 'ticker' ? 'Message' : 'Headline' }}</th>
                <th [class]="ui.th">Colour</th>
                <th [class]="ui.th">Order</th>
                <th [class]="ui.th">Schedule</th>
                <th [class]="ui.th">Status</th>
                <th [class]="ui.th" style="text-align: right">Actions</th>
              </tr>
            </thead>
            @if (loading()) {
              <app-table-skeleton [rows]="3" [cols]="6" />
            } @else {
              <tbody>
                @for (p of byKind(section.kind); track p.id) {
                  <tr>
                    <td [class]="ui.td" style="max-width: 360px">
                      <div style="font-weight: 600; color: var(--t1)">{{ p.title }}</div>
                      @if (p.badge) { <div style="font-size: 12px; color: var(--t3)">{{ p.badge }}</div> }
                    </td>
                    <td [class]="ui.td">{{ p.theme }}</td>
                    <td [class]="ui.td">{{ p.sortOrder }}</td>
                    <td [class]="ui.td" style="font-size: 12px">
                      {{ p.startsAt ? day(p.startsAt) : 'Now' }} → {{ p.endsAt ? day(p.endsAt) : 'No end' }}
                    </td>
                    <td [class]="ui.td">
                      <app-badge [variant]="status(p).variant">{{ status(p).label }}</app-badge>
                    </td>
                    <td [class]="ui.td" style="text-align: right; white-space: nowrap">
                      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost + ' ' + ui.btnSm" [disabled]="busy()" (click)="toggle(p)">
                        {{ p.isActive ? 'Hide' : 'Show' }}
                      </button>
                      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost + ' ' + ui.btnSm" [disabled]="busy()" (click)="edit(p)">Edit</button>
                      <button type="button" [class]="ui.btn + ' ' + ui.btnDanger + ' ' + ui.btnSm" [disabled]="busy()" (click)="remove(p)">Remove</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td [class]="ui.td" colspan="6" style="color: var(--t3); text-align: center; padding: 22px">
                      Nothing here yet. Customers will not see any {{ section.kind === 'ticker' ? 'top bar' : 'banner' }}.
                    </td>
                  </tr>
                }
              </tbody>
            }
          </table>
        </div>
      }
    </div>
  `,
})
export class PromotionsAdminComponent {
  protected readonly ui = tw;
  protected readonly themes = PROMOTION_THEMES;
  protected readonly sections: { kind: PromotionKind; label: string }[] = [
    { kind: 'ticker', label: 'Scrolling top bar (all customer pages)' },
    { kind: 'hero', label: 'Dashboard banners' },
  ];

  private readonly api = inject(PromotionsApiService);
  private readonly toast = inject(NotificationService);
  private readonly live = inject(PromotionsService);

  readonly items = signal<Promotion[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly draft = signal<Draft | null>(null);

  readonly byKindMap = computed(() => ({
    ticker: this.items().filter((i) => i.kind === 'ticker'),
    hero: this.items().filter((i) => i.kind === 'hero'),
  }));

  /** What customers get right now: switched on and inside the schedule window. */
  private readonly liveItems = computed(() => {
    const now = Date.now();
    return this.items().filter(
      (p) =>
        p.isActive &&
        (!p.startsAt || new Date(p.startsAt).getTime() <= now) &&
        (!p.endsAt || new Date(p.endsAt).getTime() >= now)
    );
  });
  readonly liveTicker = computed(() => this.liveItems().filter((p) => p.kind === 'ticker'));
  readonly liveHero = computed(() => this.liveItems().filter((p) => p.kind === 'hero'));
  readonly previewDuration = computed(() => Math.max(14, this.liveTicker().length * 7));

  constructor() {
    this.reload();
  }

  day(iso: string): string {
    return toDateInput(iso);
  }

  /** What customers actually get: switched off, waiting for its start date, past its end date, or live. */
  status(p: Promotion): { label: string; variant: 'bok' | 'bwn' | 'ber' | 'bgr' } {
    const now = Date.now();
    if (!p.isActive) return { label: 'Hidden', variant: 'bgr' };
    if (p.startsAt && new Date(p.startsAt).getTime() > now) return { label: 'Scheduled', variant: 'bwn' };
    if (p.endsAt && new Date(p.endsAt).getTime() < now) return { label: 'Ended', variant: 'ber' };
    return { label: 'Live', variant: 'bok' };
  }

  byKind(kind: PromotionKind): Promotion[] {
    return this.byKindMap()[kind];
  }

  private reload(): void {
    this.api.list().subscribe({
      next: (res) => {
        this.items.set(res.data?.items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message || 'Could not load promotions');
      },
    });
  }

  startNew(kind: PromotionKind): void {
    this.draft.set(blank(kind));
  }

  edit(p: Promotion): void {
    this.draft.set({
      id: p.id,
      kind: p.kind,
      title: p.title,
      subtitle: p.subtitle,
      badge: p.badge,
      ctaLabel: p.ctaLabel,
      ctaUrl: p.ctaUrl,
      theme: p.theme,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      startsAt: toDateInput(p.startsAt),
      endsAt: toDateInput(p.endsAt),
    });
  }

  patch(change: Partial<Draft>): void {
    this.draft.update((d) => (d ? { ...d, ...change } : d));
  }

  save(): void {
    const d = this.draft();
    if (!d || !d.title.trim()) return;
    const isHero = d.kind === 'hero';
    const body: PromotionInput = {
      kind: d.kind,
      title: d.title.trim(),
      subtitle: isHero ? d.subtitle.trim() : '',
      badge: isHero ? d.badge.trim() : '',
      ctaLabel: isHero ? d.ctaLabel.trim() : '',
      ctaUrl: d.ctaUrl.trim(),
      theme: d.theme,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
      // null clears the schedule on the server.
      // Local midnight, not UTC midnight, so "from today" is live straight away for the admin's own day.
      startsAt: d.startsAt ? new Date(d.startsAt + 'T00:00:00').toISOString() : null,
      endsAt: d.endsAt ? new Date(d.endsAt + 'T23:59:59').toISOString() : null,
    };
    this.busy.set(true);
    const call = d.id ? this.api.update(d.id, body) : this.api.create(body);
    call.subscribe({
      next: () => this.done(d.id ? 'Promotion updated' : 'Promotion added', true),
      error: (err) => this.fail(err, 'Could not save promotion'),
    });
  }

  toggle(p: Promotion): void {
    this.busy.set(true);
    this.api.update(p.id, { isActive: !p.isActive }).subscribe({
      next: () => this.done(p.isActive ? 'Promotion hidden' : 'Promotion is live', false),
      error: (err) => this.fail(err, 'Could not update promotion'),
    });
  }

  remove(p: Promotion): void {
    if (!confirm(`Remove "${p.title}"? Customers will stop seeing it.`)) return;
    this.busy.set(true);
    this.api.remove(p.id).subscribe({
      next: () => this.done('Promotion removed', false),
      error: (err) => this.fail(err, 'Could not remove promotion'),
    });
  }

  private done(message: string, closeForm: boolean): void {
    this.busy.set(false);
    if (closeForm) this.draft.set(null);
    this.toast.success(message);
    this.live.load(true);
    this.reload();
  }

  private fail(err: { error?: { message?: string | string[] } }, fallback: string): void {
    this.busy.set(false);
    const m = err?.error?.message;
    this.toast.error((Array.isArray(m) ? m.join(', ') : m) || fallback);
  }
}
