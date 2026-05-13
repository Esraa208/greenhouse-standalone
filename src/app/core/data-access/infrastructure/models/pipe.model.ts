import { PaginatedResponse, EntityStatus, SortKey } from './location.model';

export interface PipeRow {
  readonly id: string;
  readonly name: string;
  readonly layerId: string;
  readonly layerName: string;
  readonly systemId: string;
  readonly zoneId: string;
  readonly greenhouseId: string;
  readonly locationId: string;
  readonly capacity: number;
  readonly occupiedCapacity: number;
  readonly status: EntityStatus;
}

export interface PipeFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'capacity-desc' | 'all';
  readonly locationId: string | 'all';
  readonly greenhouseId: string | 'all';
  readonly zoneId: string | 'all';
  readonly systemId: string | 'all';
  readonly layerId: string | 'all';
}

export const DEFAULT_PIPE_FILTERS: PipeFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
  systemId: 'all',
  layerId: 'all',
};

export interface CreatePipeDto {
  name: string;
  layerId: string;
  systemId: string;
  zoneId: string;
  greenhouseId: string;
  locationId: string;
  capacity: number;
  status: EntityStatus;
  layerName?: string;
}

export interface UpdatePipeDto extends CreatePipeDto {
  id: string;
}





