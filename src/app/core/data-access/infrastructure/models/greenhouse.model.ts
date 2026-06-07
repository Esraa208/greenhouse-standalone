import { EntityStatus, SortKey, mapLocationSetOrder } from './location.model';

export interface GreenhouseRow {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly totalCapacity: number;
  readonly zonesCount: number;
  readonly occupiedCapacity: number;
  /** From API `occupancy.percent` when provided. */
  readonly occupancyPct?: number;
  readonly status: EntityStatus;
}

export interface GreenhouseFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'all';
  readonly locationId: string | 'all';
}

/** Maps UI sort keys to Units/fetch `SetOrder` query values. */
export function mapUnitSetOrder(sortBy: SortKey | 'all'): string | undefined {
  return mapLocationSetOrder(sortBy);
}

export const DEFAULT_GREENHOUSE_FILTERS: GreenhouseFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  locationId: 'all',
};

export interface CreateGreenhouseDto {
  name: string;
  address: string;
  /** Sent as `unit.locationId` (number) on create. */
  locationId: string;
  status: EntityStatus;
  locationName?: string;
}

export interface UpdateGreenhouseDto extends CreateGreenhouseDto {
  id: string;
}

export interface RefGreenhouse {
  readonly id: string;
  readonly name: string;
  readonly locationId: string;
}





