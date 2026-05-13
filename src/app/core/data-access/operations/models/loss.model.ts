export type LossSourceType = 'allocation' | 'layer' | 'batch';
export type LossType = 'disease' | 'pest' | 'weather' | 'other';

export interface LossRow {
  readonly id: string;
  readonly date: string;               // ISO string
  readonly sourceType: LossSourceType;
  readonly sourceName: string;         // "BTH-2026-001 - خس أخضر"
  readonly sourcePath: string;         // "المنطقة A • NFT-1 • الطبقة 1"
  readonly location: string;
  readonly greenhouse: string;
  readonly lossType: LossType;
  readonly quantity: number;
  readonly reason: string;
  readonly notes?: string;
  readonly recordedBy?: string;
}

export type LossSortKey = 'date-desc' | 'date-asc';

export interface LossFilters {
  searchQuery: string;
  sourceType: LossSourceType | 'all';
  lossType: LossType | 'all';
  sortBy: LossSortKey;
}

export const DEFAULT_LOSS_FILTERS: LossFilters = {
  searchQuery: '',
  sourceType: 'all',
  lossType: 'all',
  sortBy: 'date-desc',
};

export interface CreateLossDto {
  mode: 'infrastructure' | 'batch';
  locationId?: string;
  greenhouseId?: string;
  zoneId?: string;
  systemId?: string;
  layerId?: string;
  allocationId?: string;
  batchId?: string;
  lossType: LossType;
  date: string;
  quantity?: number;
  reason: string;
  notes?: string;
}

export interface LossRefLocation {
  readonly id: string;
  readonly name: string;
}
export interface LossRefGreenhouse {
  readonly id: string;
  readonly name: string;
  readonly locationId: string;
}
export interface LossRefZone {
  readonly id: string;
  readonly name: string;
  readonly greenhouseId: string;
}
export interface LossRefSystem {
  readonly id: string;
  readonly name: string;
  readonly zoneId: string;
}
export interface LossRefLayer {
  readonly id: string;
  readonly name: string;
  readonly systemId: string;
  readonly totalQuantity: number;
}
export interface LossRefAllocation {
  readonly id: string;
  readonly pipeName: string;
  readonly batchNumber: string;
  readonly cropType: string;
  readonly layerId: string;
  readonly quantity: number;
}
export interface LossRefBatch {
  readonly id: string;
  readonly batchNumber: string;
  readonly cropType: string;
  readonly totalQuantity: number;
  readonly allocationsCount: number;
}





