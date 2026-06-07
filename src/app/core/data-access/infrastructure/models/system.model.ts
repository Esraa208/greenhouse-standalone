import { EntityStatus, SortKey, mapLocationSetOrder } from './location.model';

export type SystemTypeFilter = 'all' | 'NFT' | 'DWC';

export interface SystemRow {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly zoneId: string;
  readonly zoneName: string;
  readonly greenhouseId: string;
  readonly greenhouseName: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly totalCapacity: number;
  readonly occupiedCapacity: number;
  readonly occupancyPct?: number;
  readonly layersCount: number;
  readonly status: EntityStatus;
}

export interface SystemFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'all';
  readonly systemType: SystemTypeFilter;
  readonly locationId: string | 'all';
  readonly greenhouseId: string | 'all';
  readonly zoneId: string | 'all';
}

export const DEFAULT_SYSTEM_FILTERS: SystemFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  systemType: 'all',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
};

/** Maps UI sort keys to System/fetch `SetOrder` query values. */
export function mapSystemSetOrder(sortBy: SortKey | 'all'): string | undefined {
  return mapLocationSetOrder(sortBy);
}

export function systemTypeToApiValue(type: SystemTypeFilter | string): number | undefined {
  if (type === 'DWC') return 2;
  if (type === 'NFT') return 1;
  return undefined;
}

export interface CreateSystemDto {
  name: string;
  type: string;
  zoneId: string;
  greenhouseId: string;
  locationId: string;
  status: EntityStatus;
  zoneName?: string;
  greenhouseName?: string;
  locationName?: string;
}

export interface UpdateSystemDto extends CreateSystemDto {
  id: string;
}

export interface RefSystem {
  readonly id: string;
  readonly name: string;
  readonly zoneId: string;
}





