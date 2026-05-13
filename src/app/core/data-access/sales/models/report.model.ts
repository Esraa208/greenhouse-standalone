export type ReportType = 'financial' | 'operational' | 'crops';
export type DateRange  = 'week' | 'month' | 'quarter' | 'year';

export interface ReportKpi {
  readonly totalHarvestValue: number;
  readonly totalHarvestKg: number;
  readonly harvestedBatches: number;
  readonly totalBatches: number;
  readonly avgProductivityKgPerBatch: number;
}

export interface CropRevenue {
  readonly cropName: string;
  readonly detail: string;
  readonly revenue: number;
  readonly percentage: number;
  readonly progressVariant: 'success' | 'primary' | 'warning' | 'danger';
}

export interface ProductionStat {
  readonly labelKey: string;
  readonly value: string;
  readonly colorClass?: 'success' | 'danger' | 'primary';
  readonly isBadge?: boolean;
}

export interface MonthlyTrend {
  readonly monthLabel: string;
  readonly amount: number;
  readonly progressValue: number;
  readonly progressVariant: 'success' | 'primary' | 'warning' | 'danger';
}

export interface BestPerformer {
  readonly rank: 1 | 2 | 3;
  readonly cropName: string;
  readonly weightKg: number;
  readonly revenue: number;
  readonly gradientClass: string;
  readonly badgeVariant: string;
  readonly rankEmoji: string;
  readonly rankKey: string;
}

export interface ReportData {
  readonly kpi: ReportKpi;
  readonly cropRevenues: readonly CropRevenue[];
  readonly productionStats: readonly ProductionStat[];
  readonly monthlyTrend: readonly MonthlyTrend[];
  readonly bestPerformers: readonly BestPerformer[];
}

export interface ReportFilters {
  reportType: ReportType;
  dateRange: DateRange;
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  reportType: 'financial',
  dateRange:  'month',
};





