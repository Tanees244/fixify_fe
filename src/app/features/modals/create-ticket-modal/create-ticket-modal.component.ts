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
import {
  CreateTicketPayload,
  Site,
  TicketPriority,
} from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      title="Create New Ticket"
      icon="clip"
      (closed)="closed.emit()"
    />
    <div class="mdl-b">
      <div class="fld">
        <label>Title *</label>
        <input
          class="inp"
          placeholder="Brief description of the issue"
          [ngModel]="title()"
          (ngModelChange)="title.set($event)"
        />
      </div>
      <div class="fld">
        <label>Description</label>
        <textarea
          class="inp"
          rows="3"
          placeholder="Detailed explanation..."
          style="resize: vertical"
          [ngModel]="desc()"
          (ngModelChange)="desc.set($event)"
        ></textarea>
      </div>
      <div class="g2">
        <div class="fld">
          <label>Site</label>
          <select class="inp" [ngModel]="site()" (ngModelChange)="site.set($event)">
            @for (s of sites; track s.id) {
              <option [value]="s.name">{{ s.name }}</option>
            }
          </select>
        </div>
        <div class="fld">
          <label>Type</label>
          <select class="inp" [ngModel]="type()" (ngModelChange)="type.set($event)">
            <option>Performance</option>
            <option>Security</option>
            <option>SEO</option>
            <option>Bug</option>
            <option>Uptime</option>
          </select>
        </div>
      </div>
      <div class="g2">
        <div class="fld">
          <label>Priority</label>
          <select class="inp" [ngModel]="pri()" (ngModelChange)="pri.set($event)">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    </div>
    <div class="mdl-f">
      <button type="button" class="btn bg" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        class="btn bp"
        [disabled]="!title()"
        (click)="submit()"
      >
        <app-icon name="plus" [size]="13" color="#fff" /> Create Ticket
      </button>
    </div>
  `,
})
export class CreateTicketModalComponent implements OnChanges {
  @Input({ required: true }) sites: Site[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CreateTicketPayload>();

  readonly title = signal('');
  readonly desc = signal('');
  readonly site = signal('');
  readonly type = signal('Performance');
  readonly pri = signal<TicketPriority>('medium');
  readonly who = signal('');

  ngOnChanges(): void {
    if (this.sites.length && !this.site()) {
      this.site.set(this.sites[0].name);
    }
  }

  submit(): void {
    if (!this.title()) return;
    this.submitted.emit({
      title: this.title(),
      desc: this.desc(),
      site: this.site(),
      type: this.type(),
      pri: this.pri(),
      status: 'open',
      who: this.who() || undefined,
    });
  }
}
