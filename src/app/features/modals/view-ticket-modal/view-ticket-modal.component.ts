import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketStatus } from '../../../core/models/fixify.models';
import {
  priorityBadge,
  priorityColor,
} from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';

@Component({
  selector: 'app-view-ticket-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      [title]="'Ticket ' + ticket.id"
      icon="clip"
      (closed)="closed.emit()"
    />
    <div class="mdl-b">
      <div style="margin-bottom: 16px">
        <div
          style="font-weight: 700; font-size: 16px; color: var(--t1); margin-bottom: 8px"
        >
          {{ ticket.title }}
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px">
          <app-badge [variant]="priVariant()">
            <span
              style="width: 6px; height: 6px; border-radius: 50%; display: inline-block"
              [style.background]="priColor()"
            ></span>
            {{ ticket.pri }}
          </app-badge>
          <app-badge [variant]="typeVariant()">{{ ticket.type }}</app-badge>
          <app-badge variant="bgr">
            <app-icon name="clock" [size]="10" />{{ ticket.ago }}
          </app-badge>
          <span style="margin-left: auto; font-size: 12px; color: var(--t3)">{{
            ticket.site
          }}</span>
        </div>
        <div
          style="background: var(--s2); border-radius: 10px; padding: 14px; font-size: 13.5px; color: var(--t2); line-height: 1.65; border: 1px solid var(--bd)"
        >
          {{ ticket.desc || 'No description provided.' }}
        </div>
      </div>
      <div class="g2">
        <div class="fld">
          <label>Status</label>
          <select class="inp" [ngModel]="status()" (ngModelChange)="status.set($event)">
            <option value="open">Open</option>
            <option value="inprogress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </div>
    <div class="mdl-f">
      <button type="button" class="btn bg" (click)="closed.emit()">Cancel</button>
      <button type="button" class="btn bp" (click)="submit()">
        <app-icon name="check" [size]="13" color="#fff" /> Save Changes
      </button>
    </div>
  `,
})
export class ViewTicketModalComponent implements OnChanges {
  @Input({ required: true }) ticket!: Ticket;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<{
    id: string;
    status: TicketStatus;
    who: string;
  }>();

  readonly status = signal<TicketStatus>('open');
  readonly who = signal('');

  ngOnChanges(): void {
    if (this.ticket) {
      this.status.set(this.ticket.status);
      this.who.set(this.ticket.who);
    }
  }

  priVariant(): BadgeVariant {
    return priorityBadge(this.ticket.pri) as BadgeVariant;
  }

  priColor(): string {
    return priorityColor(this.ticket.pri);
  }

  typeVariant(): BadgeVariant {
    if (this.ticket.type === 'Security') return 'bac';
    if (this.ticket.type === 'Performance') return 'bwn';
    return 'bbl';
  }

  submit(): void {
    this.submitted.emit({
      id: this.ticket.id,
      status: this.status(),
      who: this.who(),
    });
  }
}
