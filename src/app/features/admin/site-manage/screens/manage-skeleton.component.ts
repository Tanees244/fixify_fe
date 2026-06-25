import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { tw } from '../../../../shared/ui/tw';

/** Generic loading placeholder for the site management screens. */
@Component({
  selector: 'app-manage-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.smPage + ' ' + ui.u">
      <div [class]="ui.smPageHd">
        <div style="width: 100%">
          <div [class]="ui.skelBlock" style="height: 18px; width: 200px; margin-bottom: 10px"></div>
          <div [class]="ui.skelBlock" style="height: 13px; width: 320px"></div>
        </div>
      </div>

      @if (stats()) {
        <div [class]="ui.grid4 + ' ' + ui.u" style="margin: 18px 0 22px">
          @for (i of [1, 2, 3, 4]; track i) {
            <div [class]="ui.statCard">
              <div [class]="ui.skelBlock" style="height: 12px; width: 60%; margin-bottom: 12px"></div>
              <div [class]="ui.skelBlock" style="height: 22px; width: 45%; margin-bottom: 10px"></div>
              <div [class]="ui.skelBlock" style="height: 11px; width: 70%"></div>
            </div>
          }
        </div>
      }

      <div [class]="ui.grid2 + ' ' + ui.u">
        @for (i of [1, 2]; track i) {
          <div [class]="ui.card + ' ' + ui.cardPad + ' ' + ui.smPanel">
            <div [class]="ui.skelBlock" style="height: 14px; width: 40%; margin-bottom: 18px"></div>
            <div [class]="ui.skelBlock" style="height: 12px; width: 100%; margin-bottom: 12px"></div>
            <div [class]="ui.skelBlock" style="height: 12px; width: 85%; margin-bottom: 12px"></div>
            <div [class]="ui.skelBlock" style="height: 12px; width: 70%"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ManageSkeletonComponent {
  protected readonly ui = tw;
  readonly stats = input(true);
}
