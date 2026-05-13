export interface KpiCard {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly change: string;
  readonly changeType: 'up' | 'down';
  readonly iconBg: string;
  readonly sparklineData: number[];
  readonly sparklineColor: string;
}

export interface ProductionDataPoint {
  readonly id: string;
  readonly month: string;
  readonly production: number;
  readonly revenue: number;
  readonly target: number;
}

export interface ZoneProduction {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

export interface CropDistribution {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

export interface InsightCard {
  readonly id: string;
  readonly type: 'success' | 'warning' | 'info' | 'danger';
  readonly icon: string;
  readonly title: string;
  readonly message: string;
}

export interface BatchStatusCard {
  readonly id: string;
  readonly label: string;
  readonly subLabel: string;
  readonly count: number;
  readonly bgColor: string;
  readonly iconColor: string;
  readonly textColor: string;
  readonly icon: string;
}

export interface CapacityZone {
  readonly id: string;
  readonly name: string;
  readonly occupied: number;
  readonly total: number;
  readonly color: string;
}

export interface FinancialItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly percent: number;
  readonly color: string;
}





