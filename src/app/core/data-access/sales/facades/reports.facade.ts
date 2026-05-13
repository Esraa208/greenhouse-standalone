import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesReportsRepository } from '../repositories/reports.repository';
import {
  ReportData,
  ReportFilters,
  DEFAULT_REPORT_FILTERS,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class SalesReportsFacade {
  readonly #repo       = inject(SalesReportsRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #data       = signal<ReportData | null>(null);
  readonly #filters    = signal<ReportFilters>(DEFAULT_REPORT_FILTERS);
  readonly #isLoading  = signal(false);

  readonly data        = this.#data.asReadonly();
  readonly filters     = this.#filters.asReadonly();
  readonly isLoading   = this.#isLoading.asReadonly();

  readonly kpi             = computed(() => this.#data()?.kpi ?? null);
  readonly cropRevenues    = computed(() => this.#data()?.cropRevenues ?? []);
  readonly prodStats       = computed(() => this.#data()?.productionStats ?? []);
  readonly monthlyTrend    = computed(() => this.#data()?.monthlyTrend ?? []);
  readonly bestPerformers  = computed(() => this.#data()?.bestPerformers ?? []);

  loadReport(): void {
    const { reportType, dateRange } = this.#filters();
    this.#isLoading.set(true);
    this.#repo.getReportData(reportType, dateRange)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (reportData: ReportData) => {
          this.#data.set(reportData);
          this.#isLoading.set(false);
        },
        error: () => {
          this.#isLoading.set(false);
        },
      });
  }

  patchFilters(patch: Partial<ReportFilters>): void {
    this.#filters.update(f => ({ ...f, ...patch }));
    this.loadReport();
  }

  exportReport(): void {
    window.print();
  }
}





