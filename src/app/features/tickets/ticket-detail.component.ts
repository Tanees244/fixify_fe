import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataSessionService, TicketsDataService } from '../../core/services/data';
import { AuthService } from '../../core/services/auth.service';
import {
  TicketMessage,
  TicketStatus,
} from '../../core/models/fixify.models';
import {
  priorityBadge,
  priorityColor,
  ticketStatusBadge,
  ticketStatusLabel,
} from '../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { tw } from '../../shared/ui/tw';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

interface StagedFile {
  id: string;
  file: File;
  preview: string;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, BadgeComponent],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent {
  protected readonly ui = tw;
  protected readonly statusOptions = STATUS_OPTIONS;

  private readonly session = inject(DataSessionService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly priorityBadge = priorityBadge;
  readonly priorityColor = priorityColor;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  readonly isAdmin = this.auth.getCurrentUser()?.role === 'admin';
  readonly base = this.isAdmin ? '/admin' : '/customer';
  private readonly viewerRole: 'agent' | 'customer' = this.isAdmin ? 'agent' : 'customer';

  readonly ticketId = signal('');
  readonly reply = signal('');
  readonly staged = signal<StagedFile[]>([]);
  readonly internalNote = signal(false);
  readonly sending = signal(false);
  readonly lightbox = signal<string | null>(null);

  readonly ticket = computed(() => {
    this.session.dataRevision();
    return this.ticketsData.getTicket(this.ticketId());
  });

  readonly messages = computed(() => {
    this.session.dataRevision();
    const all = this.ticketsData.getMessages(this.ticketId());
    return this.isAdmin ? all : all.filter((m) => !m.isInternal);
  });

  readonly resolved = computed(() => {
    const s = this.ticket()?.status;
    return s === 'resolved' || s === 'closed';
  });

  constructor() {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id') ?? '';
      this.ticketId.set(id);
      if (id) {
        this.ticketsData.fetchTicketDetail(id);
      }
    });
  }

  back(): void {
    this.router.navigate([this.base, 'tickets']);
  }

  typeBadge(type: string): BadgeVariant {
    if (type === 'Security') return 'bac';
    if (type === 'Performance') return 'bwn';
    return 'bbl';
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  isMine(msg: TicketMessage): boolean {
    return msg.authorRole === this.viewerRole;
  }

  authorLabel(msg: TicketMessage): string {
    if (this.isMine(msg)) return 'You';
    if (msg.authorRole === 'agent') return msg.authorName || 'Fixify Support';
    return msg.authorName || 'Customer';
  }

  avatarColor(msg: TicketMessage): string {
    return msg.authorRole === 'agent' ? '#2563eb' : '#7c3aed';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.staged.update((list) => [
          ...list,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            file,
            preview: String(reader.result),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeStaged(id: string): void {
    this.staged.update((list) => list.filter((a) => a.id !== id));
  }

  async send(): Promise<void> {
    const body = this.reply().trim();
    const files = this.staged().map((s) => s.file);
    if (!body && files.length === 0) return;
    this.sending.set(true);
    try {
      await this.ticketsData.addMessage(this.ticketId(), {
        body,
        files,
        isInternal: this.isAdmin && this.internalNote(),
      });
      this.reply.set('');
      this.staged.set([]);
      this.internalNote.set(false);
    } finally {
      this.sending.set(false);
    }
  }

  setStatus(status: string): void {
    this.ticketsData.setTicketStatus(this.ticketId(), status as TicketStatus);
  }

  resolve(): void {
    this.setStatus('resolved');
  }

  reopen(): void {
    this.setStatus('open');
  }

  openLightbox(url: string): void {
    this.lightbox.set(url);
  }

  closeLightbox(): void {
    this.lightbox.set(null);
  }
}
