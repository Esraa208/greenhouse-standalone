import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { useAnalyticsReportsFixtures } from '../../data-mode';
import { environment } from '../../../../../environments/environment';
import type { CostMatrixEntry, ReportSummary } from './reports.facade';

/** Embedded samples when HTTP reporting is off or not wired yet (`environment.analyticsReportsUseHttp`). */
const FIXTURE_SUMMARIES: ReportSummary[] = [
  {
    id: '1',
    category: 'General',
    title: 'Yield Report',
    period: 'March 2024',
    status: 'published',
    totalYield: 1250,
    revenue: 12500,
    lossRate: 2.4,
    netProfit: 4300,
    totalProduction: 1250,
    totalRevenue: 12500,
    totalCosts: 8200,
  },
  {
    id: '2',
    category: 'Operations',
    title: 'Batch Efficiency',
    period: 'February 2024',
    status: 'published',
    totalYield: 1100,
    revenue: 11200,
    lossRate: 3.1,
    netProfit: 3300,
    totalProduction: 1100,
    totalRevenue: 11200,
    totalCosts: 7900,
  },
  {
    id: '3',
    category: 'Finance',
    title: 'Q1 Close',
    period: 'January 2024',
    status: 'draft',
    totalYield: 950,
    revenue: 10500,
    lossRate: 5.2,
    netProfit: -500,
    totalProduction: 950,
    totalRevenue: 10500,
    totalCosts: 11000,
  },
];

const FIXTURE_COSTS: CostMatrixEntry[] = [
  {
    id: 'c1',
    category: 'Nutrients',
    actual: 2500,
    budget: 2400,
    variance: 5.2,
    notes: 'Stock replenishment',
    month: 'March 2024',
    amount: 2500,
  },
  {
    id: 'c2',
    category: 'Electricity',
    actual: 1800,
    budget: 1840,
    variance: -2.1,
    notes: 'Improved insulation',
    month: 'March 2024',
    amount: 1800,
  },
  {
    id: 'c3',
    category: 'Labor',
    actual: 3200,
    budget: 3200,
    variance: 0,
    notes: 'Standard shift',
    month: 'March 2024',
    amount: 3200,
  },
];

@Injectable({ providedIn: 'root' })
export class AnalyticsReportsRepository {
  getSummaries(): Observable<ReportSummary[]> {
    if (useAnalyticsReportsFixtures()) {
      return of(FIXTURE_SUMMARIES).pipe(delay(300));
    }
    if (environment.analyticsReportsUseHttp) {
      // TODO: replace with real GET when contract is frozen, e.g. `${this.#base}/Reports/summaries`
      console.warn(
        '[AnalyticsReportsRepository] analyticsReportsUseHttp=true but GET is not implemented; returning [].'
      );
    }
    return of([]).pipe(delay(150));
  }

  getCostMatrix(): Observable<CostMatrixEntry[]> {
    if (useAnalyticsReportsFixtures()) {
      return of(FIXTURE_COSTS).pipe(delay(300));
    }
    if (environment.analyticsReportsUseHttp) {
      console.warn(
        '[AnalyticsReportsRepository] analyticsReportsUseHttp=true but GET is not implemented; returning [].'
      );
    }
    return of([]).pipe(delay(150));
  }
}
