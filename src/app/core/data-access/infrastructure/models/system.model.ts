import { EntityStatus, SortKey } from './location.model';

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
  readonly layersCount: number;
  readonly status: EntityStatus;
}

export interface SystemFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'zone-asc' | 'capacity-desc' | 'utilization-desc' | 'all';
  readonly locationId: string | 'all';
  readonly greenhouseId: string | 'all';
  readonly zoneId: string | 'all';
}

export const DEFAULT_SYSTEM_FILTERS: SystemFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
};

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





