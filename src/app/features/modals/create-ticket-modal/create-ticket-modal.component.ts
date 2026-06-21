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
import { tw } from '../../../shared/ui/tw';

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
    <div [class]="ui.modalBody">
      <div [class]="ui.field">
        <label [class]="ui.label">Title *</label>
        <input
          [class]="ui.input"
          placeholder="Brief description of the issue"
          [ngModel]="title()"
          (ngModelChange)="title.set($event)"
        />
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Description</label>
        <textarea
          [class]="ui.input"
          rows="3"
          placeholder="Detailed explanation..."
          style="resize: vertical"
          [ngModel]="desc()"
          (ngModelChange)="desc.set($event)"
        ></textarea>
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Site</label>
          <select [class]="ui.input" [ngModel]="site()" (ngModelChange)="site.set($event)">
            @for (s of sites; track s.id) {
              <option [value]="s.name">{{ s.name }}</option>
            }
          </select>
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Type</label>
          <select [class]="ui.input" [ngModel]="type()" (ngModelChange)="type.set($event)">
            <option>Performance</option>
            <option>Security</option>
            <option>SEO</option>
            <option>Bug</option>
            <option>Uptime</option>
          </select>
        </div>
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Priority</label>
          <select [class]="ui.input" [ngModel]="pri()" (ngModelChange)="pri.set($event)">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        [class]="ui.btn + ' ' + ui.btnPrimary"
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

  readonly ui = tw;
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
