export type EntityStatus = 'active' | 'inactive';

export interface LocationRow {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly unitsCount: number;
  readonly totalCapacity: number;
  readonly status: EntityStatus;
}

export type SortKey = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest';

export interface LocationFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  readonly sortBy: SortKey | 'all';
}

export const DEFAULT_FILTERS: LocationFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all'
};

export interface CreateLocationDto {
  name: string;
  address: string;
  status: EntityStatus;
}

export interface UpdateLocationDto extends CreateLocationDto {
  id: string;
}

export const LOCATION_SORT_OPTIONS: readonly { value: SortKey; translationKey: string }[] = [
  { value: 'name-asc', translationKey: 'sort.name_asc' },
  { value: 'name-desc', translationKey: 'sort.name_desc' },
  { value: 'date-newest', translationKey: 'sort.date_newest' },
  { value: 'date-oldest', translationKey: 'sort.date_oldest' }
];

export interface RefLocation {
  readonly id: string;
  readonly name: string;
}

export interface PaginatedResponse<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}





