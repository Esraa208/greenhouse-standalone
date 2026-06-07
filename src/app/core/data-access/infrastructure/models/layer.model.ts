import { PaginatedResponse, EntityStatus, SortKey, mapLocationSetOrder } from './location.model';

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
  /** Plants that can still be allocated on this layer. */
  readonly availableCapacity: number;
  readonly pipesCount: number;
  readonly status: EntityStatus;
}

export interface LayerFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'all';
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
  /** API `plantSystemId`. */
  systemId: string;
  /** API `capacity`. */
  totalCapacity: number;
  status: EntityStatus;
  /** UI cascade / optimistic row labels (not sent on create). */
  zoneId?: string;
  greenhouseId?: string;
  locationId?: string;
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

/** Maps UI sort keys to Layer/fetch `SetOrder` query values. */
export function mapLayerSetOrder(sortBy: SortKey | 'all'): string | undefined {
  return mapLocationSetOrder(sortBy);
}





