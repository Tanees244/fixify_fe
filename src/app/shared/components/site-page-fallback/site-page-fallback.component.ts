import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataSessionService } from '../../../core/services/data';
import { tw } from '../../ui/tw';

/**
 * What a website-scoped page (Security, Performance, SEO, Uptime) shows while it has no
 * selected website: a skeleton while the list is still loading, otherwise an explanation.
 * Without it these pages render nothing at all until the list arrives.
 */
@Component({
  selector: 'app-site-page-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (session.loading()) {
      <div aria-busy="true" aria-label="Loading page">
        <div [class]="ui.pageHeader">
          <div [class]="ui.skelBlock" style="height: 24px; width: 180px; margin-bottom: 10px"></div>
          <div [class]="ui.skelBlock" style="height: 13px; width: 300px"></div>
        </div>
        <div [class]="ui.grid4" style="margin-bottom: 22px">
          @for (i of [1, 2, 3, 4]; track i) {
            <div [class]="ui.statCard">
              <div [class]="ui.skelCell" style="height: 12px; width: 55%; margin-bottom: 14px"></div>
              <div [class]="ui.skelCell" style="height: 28px; width: 40%; margin-bottom: 8px"></div>
              <div [class]="ui.skelCell" style="height: 12px; width: 70%"></div>
            </div>
          }
        </div>
        @for (i of [1, 2]; track i) {
          <div [class]="ui.card + ' ' + ui.cardPad" style="margin-bottom: 14px">
            <div [class]="ui.skelBlock" style="height: 14px; width: 35%; margin-bottom: 14px"></div>
            <div [class]="ui.skelBlock" style="height: 12px; width: 90%; margin-bottom: 10px"></div>
            <div [class]="ui.skelBlock" style="height: 12px; width: 65%"></div>
          </div>
        }
      </div>
    } @else {
      <div [class]="ui.card + ' ' + ui.cardPad" style="text-align: center; padding: 44px 20px">
        <div style="font-weight: 700; font-size: 15px; color: var(--t1); margin-bottom: 6px">No website selected</div>
        <div style="font-size: 13px; color: var(--t3); margin-bottom: 14px">
          Add a website, or pick one from the Website list in the sidebar, to see this page.
        </div>
        <a routerLink="/customer/sites" [class]="ui.btn + ' ' + ui.btnPrimary + ' ' + ui.btnSm" style="text-decoration: none; display: inline-flex">
          My Websites
        </a>
      </div>
    }
  `,
})
export class SitePageFallbackComponent {
  protected readonly ui = tw;
  protected readonly session = inject(DataSessionService);
}
