import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RepairJobsService } from '../../services/repair-jobs.service';
import { RepairJobDto } from '../../models/repair-job';

type RangeKey = '7d' | '30d' | '365d';

type SeriesBucket = {
  label: string;
  sales: number;
  parts: number;
  profit: number;
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit {
  jobs = signal<RepairJobDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  range = signal<RangeKey>('7d');

  readonly filteredJobs = computed(() => {
    const now = new Date();
    const range = this.range();
    const cutoff = new Date(now);
    if (range === '7d') cutoff.setDate(now.getDate() - 6);
    if (range === '30d') cutoff.setDate(now.getDate() - 29);
    if (range === '365d') cutoff.setFullYear(now.getFullYear() - 1);

    return this.jobs().filter((job) => new Date(job.createdAt) >= cutoff);
  });

  readonly totals = computed(() => {
    const jobs = this.filteredJobs();
    const totalSales = jobs.reduce((sum, job) => sum + job.salePrice, 0);
    const partsCost = jobs.reduce((sum, job) => sum + job.partsCost, 0);
    const profit = jobs.reduce((sum, job) => sum + job.profit, 0);
    const avgSale = jobs.length ? totalSales / jobs.length : 0;
    const margin = totalSales ? profit / totalSales : 0;

    return { totalSales, partsCost, profit, avgSale, margin, count: jobs.length };
  });

  readonly series = computed(() => {
    const buckets = this.buildSeries(this.filteredJobs(), this.range());
    const maxValue = Math.max(
      1,
      ...buckets.map((bucket) => Math.max(bucket.sales, bucket.parts, bucket.profit))
    );
    const points = (values: number[]) => {
      if (values.length === 1) {
        return `50,${this.pointY(values[0], maxValue)}`;
      }
      return values
        .map((value, index) => {
          const x = (index / (values.length - 1)) * 100;
          const y = this.pointY(value, maxValue);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
    };

    return {
      buckets,
      maxValue,
      salesPoints: points(buckets.map((b) => b.sales)),
      profitPoints: points(buckets.map((b) => b.profit))
    };
  });

  private readonly money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  constructor(private jobsService: RepairJobsService) {}

  ngOnInit(): void {
    this.jobsService.getAll().subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load analytics.');
        this.loading.set(false);
      }
    });
  }

  setRange(range: RangeKey) {
    this.range.set(range);
  }

  formatMoney(value: number) {
    return this.money.format(value);
  }

  formatPercent(value: number) {
    return `${(value * 100).toFixed(1)}%`;
  }

  barHeight(value: number) {
    const max = this.series().maxValue;
    return Math.round((value / max) * 100);
  }

  private pointY(value: number, max: number) {
    const clamped = Math.max(0, value);
    const ratio = clamped / max;
    return 100 - ratio * 100;
  }

  private buildSeries(jobs: RepairJobDto[], range: RangeKey): SeriesBucket[] {
    const now = new Date();
    const buckets: SeriesBucket[] = [];

    if (range === '365d') {
      const months: Date[] = [];
      for (let i = 11; i >= 0; i -= 1) {
        months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
      }

      for (const monthStart of months) {
        const label = monthStart.toLocaleString('en-US', { month: 'short' });
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
        const items = jobs.filter((job) => {
          const created = new Date(job.createdAt);
          return created >= monthStart && created < monthEnd;
        });
        buckets.push(this.rollup(label, items));
      }
    } else {
      const days = range === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i -= 1) {
        const day = new Date(now);
        day.setHours(0, 0, 0, 0);
        day.setDate(now.getDate() - i);
        const next = new Date(day);
        next.setDate(day.getDate() + 1);
        const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const items = jobs.filter((job) => {
          const created = new Date(job.createdAt);
          return created >= day && created < next;
        });
        buckets.push(this.rollup(label, items));
      }
    }

    return buckets;
  }

  private rollup(label: string, jobs: RepairJobDto[]): SeriesBucket {
    return {
      label,
      sales: jobs.reduce((sum, job) => sum + job.salePrice, 0),
      parts: jobs.reduce((sum, job) => sum + job.partsCost, 0),
      profit: jobs.reduce((sum, job) => sum + job.profit, 0)
    };
  }
}
