import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PROCESS_ACTIONS } from '../../../core/constants/fixify.constants';
import { CreateProcessPayload, Site } from '../../../core/models/fixify.models';
import { AppContextService } from '../../../core/services/app-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-create-process-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      title="Create Automation Process"
      icon="refresh"
      (closed)="closed.emit()"
    />
    <div [class]="ui.modalBody">
      <div [class]="ui.field">
        <label [class]="ui.label">Process Name *</label>
        <input
          [class]="ui.input"
          placeholder="e.g. Monthly Plugin Updates"
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
        />
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Description</label>
        <textarea
          [class]="ui.input"
          rows="2"
          placeholder="What does this process do?"
          style="resize: vertical"
          [ngModel]="desc()"
          (ngModelChange)="desc.set($event)"
        ></textarea>
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Schedule</label>
          <select [class]="ui.input" [ngModel]="trigger()" (ngModelChange)="trigger.set($event)">
            <option value="daily">Every Day</option>
            <option value="weekly">Every Week</option>
            <option value="monthly">Every Month</option>
          </select>
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">{{ scheduleLabel() }}</label>
          @if (trigger() === 'monthly') {
            <select [class]="ui.input" [ngModel]="day()" (ngModelChange)="day.set($event)">
              @for (d of monthDays; track d) {
                <option [value]="d">Day {{ d }}</option>
              }
            </select>
          }
          @if (trigger() === 'weekly') {
            <select [class]="ui.input" [ngModel]="day()" (ngModelChange)="day.set($event)">
              @for (d of weekDays; track d) {
                <option [value]="d">{{ d }}</option>
              }
            </select>
          }
          @if (trigger() === 'daily') {
            <input
              [class]="ui.input"
              type="time"
              [ngModel]="time()"
              (ngModelChange)="time.set($event)"
            />
          }
        </div>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Target Sites</label>
        <select [class]="ui.input" [ngModel]="targetSites()" (ngModelChange)="targetSites.set($event)">
          <option value="all">All My Sites</option>
          @for (s of mySites; track s.id) {
            <option [value]="s.name">{{ s.name }}</option>
          }
        </select>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Actions — select steps in order</label>
        <div style="display: flex; flex-wrap: wrap; gap: 7px; margin-top: 6px">
          @for (action of actions; track action) {
            <div
              (click)="toggleAction(action)"
              [style.border]="
                '1.5px solid ' +
                (selectedActions().includes(action) ? 'var(--acc)' : 'var(--bd)')
              "
              [style.background]="
                selectedActions().includes(action) ? 'var(--acl)' : 'var(--sr)'
              "
              [style.color]="
                selectedActions().includes(action) ? 'var(--acc)' : 'var(--t2)'
              "
              [style.fontWeight]="selectedActions().includes(action) ? 600 : 400"
              style="padding: 6px 12px; border-radius: 99px; font-size: 12.5px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px"
            >
              @if (selectedActions().includes(action)) {
                <app-icon name="check" [size]="10" color="var(--acc)" />
              }
              {{ action }}
            </div>
          }
        </div>
        @if (selectedActions().length) {
          <div
            style="margin-top: 10px; padding: 10px 12px; background: var(--s2); border-radius: 9px; border: 1px solid var(--bd)"
          >
            <div
              class="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-fixify-text-3"
            >
              Execution Order
            </div>
            @for (action of selectedActions(); track action; let i = $index) {
              <div
                class="flex items-center gap-2 py-1 text-[12.5px] text-fixify-text-2"
              >
                <span
                  style="width: 18px; height: 18px; border-radius: 50%; background: var(--acc); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0"
                  >{{ i + 1 }}</span
                >
                {{ action }}
              </div>
            }
          </div>
        }
      </div>
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        [class]="ui.btn + ' ' + ui.btnPrimary"
        [disabled]="!name() || !selectedActions().length"
        (click)="submit()"
      >
        <app-icon name="zap" [size]="13" color="#fff" /> Create Process
      </button>
    </div>
  `,
})
export class CreateProcessModalComponent {
  private readonly ctx = inject(AppContextService);

  @Input({ required: true }) sites: Site[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CreateProcessPayload>();

  readonly ui = tw;
  readonly name = signal('');
  readonly desc = signal('');
  readonly trigger = signal('monthly');
  readonly day = signal('1');
  readonly time = signal('02:00');
  readonly targetSites = signal('all');
  readonly selectedActions = signal<string[]>([]);

  readonly actions = PROCESS_ACTIONS;
  readonly monthDays = [1, 2, 3, 4, 5, 7, 10, 14, 15, 28];
  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  get mySites(): Site[] {
    const custId = this.ctx.currentCustomerId();
    return this.sites.filter((s) => s.custId === custId);
  }

  scheduleLabel(): string {
    if (this.trigger() === 'monthly') return 'Day of Month';
    if (this.trigger() === 'weekly') return 'Day of Week';
    return 'Run Time';
  }

  toggleAction(action: string): void {
    const current = this.selectedActions();
    this.selectedActions.set(
      current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action],
    );
  }

  submit(): void {
    if (!this.name() || !this.selectedActions().length) return;
    this.submitted.emit({
      name: this.name(),
      desc: this.desc() || undefined,
      trigger: this.trigger(),
      day: this.day(),
      time: this.time(),
      targetSites: this.targetSites(),
      actions: this.selectedActions(),
    });
  }
}
