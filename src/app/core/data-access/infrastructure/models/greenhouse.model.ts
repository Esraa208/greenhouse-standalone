import { EntityStatus, SortKey } from './location.model';

export interface GreenhouseRow {
  readonly id: string;
  readonly name: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly totalCapacity: number;
  readonly zonesCount: number;
  readonly occupiedCapacity: number;
  readonly status: EntityStatus;
}

export interface GreenhouseFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'location-asc' | 'all';
  readonly locationId: string | 'all';
}

export const DEFAULT_GREENHOUSE_FILTERS: GreenhouseFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  locationId: 'all',
};

export interface CreateGreenhouseDto {
  name: string;
  /** Sent as `unit.locationId` (number) on create. */
  locationId: string;
  status: EntityStatus;
  /** Maps to API `unit.address`; optional until the form collects it. */
  address?: string;
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





