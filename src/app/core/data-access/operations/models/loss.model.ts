import { mapLossTypeToApi, type LossType } from '../utils/loss-type.util';

export type { LossType } from '../utils/loss-type.util';
export type LossSourceType = 'allocation' | 'layer' | 'batch';

export interface LossRow {
  readonly id: string;
  readonly date: string;               // ISO string
  readonly sourceType: LossSourceType;
  readonly sourceTypeLabel: string;    // e.g. "التسكينة"
  readonly sourceName: string;         // "BTH-2026-001 - بتافيا"
  readonly sourcePath: string;         // "زوون • سيستم • لير"
  readonly location: string;
  readonly greenhouse: string;
  readonly lossType: LossType;
  readonly lossTypeLabel?: string;
  readonly quantity: number;
  readonly reason: string;
  readonly notes?: string;
  readonly recordedBy?: string;
}

export type LossSortKey = 'date-desc' | 'date-asc';

export interface LossFilters {
  searchQuery: string;
  lossType: LossType | 'all';
  sortBy: LossSortKey;
  batchId: string | 'all';
  locationId: string | 'all';
  greenhouseId: string | 'all';
  zoneId: string | 'all';
  systemId: string | 'all';
  layerId: string | 'all';
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_LOSS_FILTERS: LossFilters = {
  searchQuery: '',
  lossType: 'all',
  sortBy: 'date-desc',
  batchId: 'all',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
  systemId: 'all',
  layerId: 'all',
  dateFrom: '',
  dateTo: '',
};

function toDayStart(isoDate: string): string {
  return `${isoDate}T00:00:00`;
}

function toDayEnd(isoDate: string): string {
  return `${isoDate}T23:59:59`;
}

/** Maps UI filters → Losses/fetch query params (excluding pagination/search). */
export function buildLossFetchExtraParams(
  f: LossFilters,
): Record<string, string | number> {
  const extra: Record<string, string | number> = {};
  if (f.batchId !== 'all' && f.batchId) extra['BatchId'] = Number(f.batchId);
  if (f.locationId !== 'all' && f.locationId) extra['LocationId'] = Number(f.locationId);
  if (f.greenhouseId !== 'all' && f.greenhouseId) extra['UnitId'] = Number(f.greenhouseId);
  if (f.zoneId !== 'all' && f.zoneId) extra['ZoneId'] = Number(f.zoneId);
  if (f.systemId !== 'all' && f.systemId) extra['SystemId'] = Number(f.systemId);
  if (f.layerId !== 'all' && f.layerId) extra['LayerId'] = Number(f.layerId);
  if (f.lossType !== 'all') extra['LossType'] = mapLossTypeToApi(f.lossType);
  if (f.dateFrom) extra['DateFrom'] = toDayStart(f.dateFrom);
  if (f.dateTo) extra['DateTo'] = toDayEnd(f.dateTo);
  return extra;
}

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

export interface LossAffectedAllocation {
  readonly locationName: string;
  readonly unitName: string;
  readonly zoneName: string;
  readonly systemName: string;
  readonly layerName: string;
  readonly pipeName: string;
  readonly quantity: number;
}





