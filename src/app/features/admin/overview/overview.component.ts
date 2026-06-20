import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import {
  formatDateLong,
  priorityBadge,
  scoreColor,
  ticketStatusBadge,
  ticketStatusLabel,
} from '../../../core/utils/fixify.utils';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ProgressBarComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  private readonly data = inject(FixifyDataService);
  private readonly router = inject(Router);

  readonly customers = this.data.customers;
  readonly sites = this.data.sites;
  readonly tickets = this.data.tickets;
  readonly loading = this.data.loading;

  readonly dateLabel = formatDateLong();
  readonly scoreColor = scoreColor;
  readonly priorityBadge = priorityBadge;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  readonly totalHealth = computed(() => {
    this.data.dataRevision();
    const sites = this.sites;
    return sites.length
      ? Math.round(sites.reduce((a, s) => a + s.health, 0) / sites.length)
      : 0;
  });

  readonly openTickets = computed(() => {
    this.data.dataRevision();
    return this.tickets.filter((t) => t.status !== 'resolved').length;
  });

  readonly criticalTickets = computed(() => {
    this.data.dataRevision();
    return this.tickets.filter((t) => t.pri === 'critical' && t.status !== 'resolved').length;
  });

  readonly activeCustomers = computed(() => {
    this.data.dataRevision();
    return this.customers.filter((c) => c.status === 'active').length;
  });

  readonly healthDistribution = computed(() => {
    this.data.dataRevision();
    return [
    {
      label: 'Healthy (80–100)',
      count: this.sites.filter((s) => s.health >= 80).length,
      color: 'var(--ok)',
    },
    {
      label: 'Warning (60–79)',
      count: this.sites.filter((s) => s.health >= 60 && s.health < 80).length,
      color: 'var(--wn)',
    },
    {
      label: 'Critical (< 60)',
      count: this.sites.filter((s) => s.health < 60).length,
      color: 'var(--er)',
    },
  ];
  });

  readonly revenuePlans = computed(() => {
    this.data.dataRevision();
    return this.data.subscriptionPlans.map((p) => ({
      plan: p.name,
      planId: p.id,
      revenue: `$${this.customers.filter((c) => c.plan === p.id && c.approvalStatus === 'approved').length * p.price}`,
      count: this.customers.filter((c) => c.plan === p.id && c.approvalStatus === 'approved').length,
      color: p.color,
    }));
  });

  readonly recentTickets = computed(() => {
    this.data.dataRevision();
    return this.tickets.slice(0, 5);
  });

  readonly statCards = computed(() => {
    this.data.dataRevision();
    return [
    {
      label: 'Total Customers',
      value: this.customers.length,
      sub: `${this.activeCustomers()} active`,
      color: 'var(--acc)',
      icon: 'users',
    },
    {
      label: 'Monitored Sites',
      value: this.sites.length,
      sub: 'Across all customers',
      color: 'var(--t1)',
      icon: 'globe',
    },
    {
      label: 'Open Tickets',
      value: this.openTickets(),
      sub: `${this.criticalTickets()} critical`,
      color: this.openTickets() > 3 ? 'var(--er)' : 'var(--wn)',
      icon: 'clip',
    },
    {
      label: 'Avg Health Score',
      value: this.totalHealth(),
      sub: 'All sites combined',
      color: scoreColor(this.totalHealth()),
      icon: 'activity',
    },
  ];
  });

  customerFor(custId: number) {
    return this.customers.find((c) => c.id === custId);
  }

  customerName(t: { custId: number; customerName?: string }): string {
    return t.customerName ?? this.customerFor(t.custId)?.name ?? '—';
  }

  healthPct(count: number): number {
    return this.sites.length ? (count / this.sites.length) * 100 : 0;
  }

  viewAllTickets(): void {
    this.router.navigate(['/admin/tickets']);
  }
}
