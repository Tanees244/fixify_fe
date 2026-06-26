import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { Customer, Site, Ticket } from '../../../core/models/fixify.models';
import {
  ticketStatusBadge,
  ticketStatusLabel,
} from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-view-customer-modal',
  standalone: true,
  imports: [
    IconComponent,
    ModalHeaderComponent,
    BadgeComponent,
    SiteAvatarComponent,
    ProgressRingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      title="Customer Details"
      icon="eye"
      (closed)="closed.emit()"
    />
    <div [class]="ui.modalBody">
      <div
        style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--acs); border-radius: 12px; margin-bottom: 20px"
      >
        <div [class]="ui.avatar + ' h-12 w-12 text-base'">
          {{ customer.avatar }}
        </div>
        <div style="flex: 1">
          <div class="text-base font-bold text-fixify-text-1">
            {{ customer.name }}
          </div>
          <div class="mt-0.5 text-[13px] text-fixify-text-3">
            {{ customer.company }}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 6px">
            <app-badge variant="bac">{{ planLabel(customer.plan) }}</app-badge>
            <app-badge [variant]="statusVariant()">{{ customer.status }}</app-badge>
            @if (customer.approvalStatus !== 'approved') {
              <app-badge variant="bwn">{{ customer.approvalStatus }}</app-badge>
            }
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px">
          <div class="flex items-center gap-1.5 text-[12.5px] text-fixify-text-3">
            <app-icon name="mail" [size]="13" /> {{ customer.email }}
          </div>
          @if (customer.phone) {
            <div class="flex items-center gap-1.5 text-[12.5px] text-fixify-text-3">
              <app-icon name="phone" [size]="13" /> {{ customer.phone }}
            </div>
          }
          <div class="text-xs text-fixify-text-3">
            Member since {{ customer.joined }}
          </div>
        </div>
      </div>

      <div [class]="ui.grid3 + ' mb-5'">
        @for (stat of stats; track stat.label) {
          <div
            style="background: var(--s2); border: 1px solid var(--bd); border-radius: 10px; padding: 14px 16px; text-align: center"
          >
            <div [style.color]="stat.color" style="font-size: 24px; font-weight: 700">
              {{ stat.value }}
            </div>
            <div class="mt-0.5 text-xs text-fixify-text-3">
              {{ stat.label }}
            </div>
          </div>
        }
      </div>

      @if (custSites.length) {
        <div class="mb-2.5 text-sm font-bold text-fixify-text-1">
          Monitored Sites
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px">
          @for (s of custSites; track s.id) {
            <div
              style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--s2); border-radius: 10px; border: 1px solid var(--bd)"
            >
              <app-site-avatar [fa]="s.fa" [size]="32" />
              <span class="flex-1 text-[13px] font-semibold text-fixify-text-1">{{
                s.name
              }}</span>
              <span class="text-xs text-fixify-text-3">{{ s.issues }} issues</span>
              <app-progress-ring [score]="s.health" [size]="40" [strokeWidth]="4" />
              <app-badge [variant]="siteVariant(s)">{{ siteLabel(s) }}</app-badge>
            </div>
          }
        </div>
      }

      @if (custTickets.length) {
        <div class="mb-2.5 text-sm font-bold text-fixify-text-1">
          Recent Tickets
        </div>
        @for (t of recentTickets; track t.id) {
          <div
            style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: var(--s2); border-radius: 9px; border: 1px solid var(--bd); margin-bottom: 6px"
          >
            <span
              style="font-family: 'DM Mono', monospace; font-size: 11.5px; color: var(--acc); font-weight: 600"
              >{{ t.id }}</span
            >
            <span
              class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-fixify-text-2"
              >{{ t.title }}</span
            >
            <app-badge [variant]="ticketBadge(t.status)">{{
              ticketLabel(t.status)
            }}</app-badge>
          </div>
        }
      }
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()">Close</button>
      <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" (click)="manage.emit(customer)">
        <app-icon name="edit" [size]="13" color="#fff" /> Manage Customer
      </button>
    </div>
  `,
})
export class ViewCustomerModalComponent {
  @Input({ required: true }) customer!: Customer;
  @Input({ required: true }) sites: Site[] = [];
  @Input({ required: true }) tickets: Ticket[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() manage = new EventEmitter<Customer>();

  private readonly data = inject(FixifyDataService);

  readonly ui = tw;

  planLabel(id: string): string {
    return this.data.planLabel(id);
  }

  get custSites(): Site[] {
    return this.sites.filter((s) => s.custId === this.customer.id);
  }

  get custTickets(): Ticket[] {
    return this.tickets.filter((t) => t.custId === this.customer.id);
  }

  get recentTickets(): Ticket[] {
    return this.custTickets.slice(0, 3);
  }

  get openTickets(): number {
    return this.custTickets.filter((t) => t.status !== 'resolved').length;
  }

  get stats(): { label: string; value: number; color: string }[] {
    const avgHealth = this.custSites.length
      ? Math.round(
          this.custSites.reduce((a, s) => a + s.health, 0) / this.custSites.length,
        )
      : 0;
    return [
      { label: 'Websites', value: this.custSites.length, color: 'var(--acc)' },
      {
        label: 'Open Tickets',
        value: this.openTickets,
        color: this.openTickets > 0 ? 'var(--er)' : 'var(--ok)',
      },
      { label: 'Avg Health', value: avgHealth, color: 'var(--ok)' },
    ];
  }

  statusVariant(): BadgeVariant {
    if (this.customer.status === 'active') return 'bok';
    if (this.customer.status === 'warning') return 'bwn';
    return 'ber';
  }

  siteVariant(s: Site): BadgeVariant {
    if (s.st === 'ok') return 'bok';
    if (s.st === 'warn') return 'bwn';
    return 'ber';
  }

  siteLabel(s: Site): string {
    if (s.st === 'ok') return 'Healthy';
    if (s.st === 'warn') return 'Warning';
    return 'Critical';
  }

  ticketBadge(status: Ticket['status']): BadgeVariant {
    return ticketStatusBadge(status) as BadgeVariant;
  }

  ticketLabel(status: Ticket['status']): string {
    return ticketStatusLabel(status);
  }
}
