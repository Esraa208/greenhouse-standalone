// libs/analytics/data-access/src/lib/models/dashboard.model.ts

export interface KpiMetrics {
  readonly totalProduction: number;
  readonly productionTrend: number;
  readonly activeBatches: number;
  readonly batchesTrend: number;
  readonly lossesKg: number;
  readonly lossesTrend: number;
  readonly revenue: number;
  readonly revenueTrend: number;
}

export interface ChartDataset {
  readonly data: number[];
  readonly label: string;
}

export interface DashboardData {
  readonly metrics: KpiMetrics;
  readonly productionChart: {
    readonly labels: string[];
    readonly datasets: ChartDataset[];
  };
  readonly zoneChart: {
    readonly labels: string[];
    readonly datasets: ChartDataset[];
  };
  readonly cropChart: {
    readonly labels: string[];
    readonly datasets: ChartDataset[];
  };
}





