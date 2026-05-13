import { PaginatedResponse, EntityStatus, SortKey } from './location.model';

export interface LayerRow {
  readonly id: string;
  readonly name: string;
  readonly systemId: string;
  readonly systemName: string;
  readonly zoneId: string;
  readonly greenhouseId: string;
  readonly locationId: string;
  readonly position: number;
  readonly totalCapacity: number;
  readonly occupiedCapacity: number;
  readonly pipesCount: number;
  readonly status: EntityStatus;
}

export interface LayerFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'system-asc' | 'capacity-desc' | 'all';
  readonly locationId: string | 'all';
  readonly greenhouseId: string | 'all';
  readonly zoneId: string | 'all';
  readonly systemId: string | 'all';
}

export const DEFAULT_LAYER_FILTERS: LayerFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
  systemId: 'all',
};

export interface CreateLayerDto {
  name: string;
  systemId: string;
  zoneId: string;
  greenhouseId: string;
  locationId: string;
  position: number;
  totalCapacity: number;
  status: EntityStatus;
  systemName?: string;
}

export interface UpdateLayerDto extends CreateLayerDto {
  id: string;
}

export interface RefLayer {
  readonly id: string;
  readonly name: string;
  readonly systemId: string;
}





