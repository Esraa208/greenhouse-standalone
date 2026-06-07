import { PaginatedResponse, EntityStatus, SortKey, mapLocationSetOrder } from './location.model';

export interface ZoneRow {
  readonly id: string;
  readonly name: string;
  readonly greenhouseId: string;
  readonly greenhouseName: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly totalCapacity: number;
  readonly systemsCount: number;
  readonly occupiedCapacity: number;
  readonly occupancyPct?: number;
  readonly status: EntityStatus;
}

export interface ZoneFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'all';
  readonly locationId: string | 'all';
  readonly greenhouseId: string | 'all';
}

/** Maps UI sort keys to Zone/fetch `SetOrder` query values. */
export function mapZoneSetOrder(sortBy: SortKey | 'all'): string | undefined {
  return mapLocationSetOrder(sortBy);
}

export const DEFAULT_ZONE_FILTERS: ZoneFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  locationId: 'all',
  greenhouseId: 'all',
};

export interface CreateZoneDto {
  name: string;
  greenhouseId: string;
  locationId: string;
  status: EntityStatus;
  greenhouseName?: string;
  locationName?: string;
}

export interface UpdateZoneDto extends CreateZoneDto {
  id: string;
}

export interface RefZone {
  readonly id: string;
  readonly name: string;
  readonly greenhouseId: string;
}





