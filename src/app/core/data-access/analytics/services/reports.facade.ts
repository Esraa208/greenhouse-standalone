import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AnalyticsReportsRepository } from './reports.repository';

export interface ReportSummary {
  id: string;
  category: string;
  title: string;
  period: string;
  status: string;
  totalYield: number;
  revenue: number;
  lossRate: number;
  netProfit: number;
  totalProduction: number;
  totalRevenue: number;
  totalCosts: number;
}

export interface CostMatrixEntry {
  id: string;
  category: string;
  actual: number;
  budget: number;
  variance: number;
  notes: string;
  month: string;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsReportsFacade {
  readonly #repo = inject(AnalyticsReportsRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #summaries = signal<ReportSummary[]>([]);
  readonly #costMatrix = signal<CostMatrixEntry[]>([]);
  readonly #isLoading = signal(false);
  readonly #activeTab = signal<'summary' | 'costs'>('summary');

  readonly summaries = this.#summaries.asReadonly();
  readonly costMatrix = this.#costMatrix.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly activeTab = this.#activeTab.asReadonly();

  readonly summaryCount = computed(() => this.#summaries().length);
  readonly costRowCount = computed(() => this.#costMatrix().length);

  load(): void {
    this.#isLoading.set(true);
    forkJoin({
      summaries: this.#repo.getSummaries(),
      costs: this.#repo.getCostMatrix(),
    })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#isLoading.set(false)),
      )
      .subscribe({
        next: ({ summaries, costs }) => {
          this.#summaries.set(summaries);
          this.#costMatrix.set(costs);
        },
      });
  }

  setTab(tab: 'summary' | 'costs'): void {
    this.#activeTab.set(tab);
  }

  downloadReport(id: string): void {
    console.warn('[AnalyticsReportsFacade] downloadReport', id);
  }
}
