import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ReportData, ReportType, DateRange } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class SalesReportsRepository {

  getReportData(type: ReportType, range: DateRange): Observable<ReportData> {
    return of({
      kpi: {
        totalHarvestValue: 45670,
        totalHarvestKg: 3045,
        harvestedBatches: 28,
        totalBatches: 35,
        avgProductivityKgPerBatch: 108,
      },
      cropRevenues: [
        {
          cropName: 'خس أخضر',
          detail: '1,250 كجم × 15 ريال',
          revenue: 18750,
          percentage: 41,
          progressVariant: 'success' as const,
        },
        {
          cropName: 'ريحان',
          detail: '580 كجم × 25 ريال',
          revenue: 14500,
          percentage: 32,
          progressVariant: 'primary' as const,
        },
        {
          cropName: 'طماطم شيري',
          detail: '480 كجم × 20 ريال',
          revenue: 9600,
          percentage: 21,
          progressVariant: 'warning' as const,
        },
        {
          cropName: 'نعناع',
          detail: '92 كجم × 30 ريال',
          revenue: 2760,
          percentage: 6,
          progressVariant: 'danger' as const,
        },
      ],
      productionStats: [
        { labelKey: 'reports.stat_total_batches', value: '35' },
        { labelKey: 'reports.stat_harvested', value: '28', colorClass: 'success' as const },
        { labelKey: 'reports.stat_active', value: '7', colorClass: 'primary' as const },
        { labelKey: 'reports.stat_growth_rate', value: '98.5%', isBadge: true },
        { labelKey: 'reports.stat_losses', value: '1.5%', colorClass: 'danger' as const },
        { labelKey: 'reports.stat_avg_harvest', value: '38 يوم' },
      ],
      monthlyTrend: [
        { monthLabel: 'يناير 2026', amount: 45670, progressValue: 100, progressVariant: 'success' as const },
        { monthLabel: 'ديسمبر 2025', amount: 40800, progressValue: 82, progressVariant: 'primary' as const },
        { monthLabel: 'نوفمبر 2025', amount: 38500, progressValue: 77, progressVariant: 'warning' as const },
        { monthLabel: 'أكتوبر 2025', amount: 35200, progressValue: 70, progressVariant: 'danger' as const },
      ],
      bestPerformers: [
        {
          rank: 1 as const,
          cropName: 'خس أخضر',
          weightKg: 1250,
          revenue: 18750,
          gradientClass: 'reports-page__performer--gold',
          badgeVariant: 'active',
          rankEmoji: '🏆',
          rankKey: 'reports.rank_1',
        },
        {
          rank: 2 as const,
          cropName: 'ريحان',
          weightKg: 580,
          revenue: 14500,
          gradientClass: 'reports-page__performer--silver',
          badgeVariant: 'info',
          rankEmoji: '🥈',
          rankKey: 'reports.rank_2',
        },
        {
          rank: 3 as const,
          cropName: 'طماطم شيري',
          weightKg: 480,
          revenue: 9600,
          gradientClass: 'reports-page__performer--bronze',
          badgeVariant: 'warning',
          rankEmoji: '🥉',
          rankKey: 'reports.rank_3',
        },
      ],
    } as ReportData).pipe(delay(300));
  }
}








