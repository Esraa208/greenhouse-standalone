import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { TranslationService } from '@app/core';
import { SalesReportsFacade } from '@app/core/data-access/sales';
import { SALES_REPORTS_PAGE_IMPORTS } from '@app/shared/page-imports';
import { CropRevenue, ProductionStat, MonthlyTrend, BestPerformer } from '@app/core/data-access/sales';

@Component({
  selector: 'gh-sales-reports-page',
  standalone: true,
  imports: [...SALES_REPORTS_PAGE_IMPORTS],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent {
  readonly facade = inject(SalesReportsFacade);
  readonly i18n   = inject(TranslationService);

  readonly trackByCropName = (_: number, item: CropRevenue): string => item.cropName;
  readonly trackByLabel    = (_: number, item: ProductionStat): string => item.labelKey;
  readonly trackByMonth    = (_: number, item: MonthlyTrend): string => item.monthLabel;
  readonly trackByRank     = (_: number, item: BestPerformer): number => item.rank;

  constructor() {
    this.facade.loadReport();
  }

  onReportTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.facade.patchFilters({ reportType: value as 'financial' | 'operational' | 'crops' });
  }

  onDateRangeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.facade.patchFilters({ dateRange: value as 'week' | 'month' | 'quarter' | 'year' });
  }
}






