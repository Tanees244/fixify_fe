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
  TicketAttachment,
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
    <app-modal-header title="Open a support ticket" icon="clip" (closed)="closed.emit()" />
    <div [class]="ui.modalBody">
      <div [class]="ui.field">
        <label [class]="ui.label">Subject *</label>
        <input
          [class]="ui.input"
          placeholder="Brief summary of the issue"
          [ngModel]="title()"
          (ngModelChange)="title.set($event)"
        />
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Website</label>
          <select [class]="ui.input" [ngModel]="site()" (ngModelChange)="site.set($event)">
            @for (s of sites; track s.id) {
              <option [value]="s.name">{{ s.name }}</option>
            }
          </select>
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Category</label>
          <select [class]="ui.input" [ngModel]="type()" (ngModelChange)="type.set($event)">
            <option>Performance</option>
            <option>Security</option>
            <option>SEO</option>
            <option>Bug</option>
            <option>Uptime</option>
          </select>
        </div>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Severity</label>
        <select [class]="ui.input" [ngModel]="pri()" (ngModelChange)="pri.set($event)">
          <option value="critical">Critical — site is down / unusable</option>
          <option value="high">High — major feature broken</option>
          <option value="medium">Medium — degraded experience</option>
          <option value="low">Low — question / minor issue</option>
        </select>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Description</label>
        <textarea
          [class]="ui.input"
          rows="4"
          placeholder="What happened, what you expected, and any steps to reproduce…"
          style="resize: vertical"
          [ngModel]="desc()"
          (ngModelChange)="desc.set($event)"
        ></textarea>
      </div>

      <div [class]="ui.field">
        <label [class]="ui.label">Attachments</label>
        @if (staged().length) {
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px">
            @for (att of staged(); track att.id) {
              <div style="position: relative; width: 72px; height: 72px; border-radius: 10px; overflow: hidden; border: 1px solid var(--bd)">
                <img [src]="att.url" [alt]="att.name" style="width: 100%; height: 100%; object-fit: cover" />
                <button
                  type="button"
                  (click)="removeStaged(att.id)"
                  title="Remove"
                  style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 999px; border: none; background: rgba(0,0,0,.6); color: #fff; cursor: pointer; line-height: 1; font-size: 12px"
                >
                  &times;
                </button>
              </div>
            }
          </div>
        }
        <label
          [class]="ui.btn + ' ' + ui.btnGhost"
          style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px"
        >
          <app-icon name="clip" [size]="14" color="var(--t2)" />
          Attach screenshots
          <input type="file" accept="image/*" multiple hidden (change)="onFilesSelected($event)" />
        </label>
      </div>
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        [class]="ui.btn + ' ' + ui.btnPrimary"
        [disabled]="!title().trim()"
        (click)="submit()"
      >
        <app-icon name="plus" [size]="13" color="#fff" /> Create ticket
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
  readonly staged = signal<TicketAttachment[]>([]);

  ngOnChanges(): void {
    if (this.sites.length && !this.site()) {
      this.site.set(this.sites[0].name);
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        this.staged.update((list) => [
          ...list,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: String(reader.result),
            name: file.name,
            kind: 'image',
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeStaged(id: string): void {
    this.staged.update((list) => list.filter((a) => a.id !== id));
  }

  submit(): void {
    if (!this.title().trim()) return;
    this.submitted.emit({
      title: this.title().trim(),
      desc: this.desc().trim(),
      site: this.site(),
      type: this.type(),
      pri: this.pri(),
      status: 'open',
      who: this.who() || undefined,
      attachments: this.staged(),
    });
  }
}
