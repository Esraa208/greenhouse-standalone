import type { EntityStatus } from '../../infrastructure/models/location.model';

export interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email?: string;
  readonly address?: string;
  readonly status: EntityStatus;
  readonly invoicesCount: number;
  readonly totalPurchases: number;
  readonly createdAt: string;
}

export type CustomerSortKey = 'name-asc' | 'name-desc';

export interface CustomerFilters {
  readonly searchQuery: string;
  readonly status: EntityStatus | 'all';
  /** `'all'` = default server order (newest by creation date). */
  readonly sortBy: CustomerSortKey | 'all';
}

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
};

/** Name sort only — API `SetOrder`: `asc` | `desc`. Omitted = newest first. */
export const CUSTOMER_SORT_OPTIONS = [
  { value: 'name-asc', translationKey: 'sort.name_asc' },
  { value: 'name-desc', translationKey: 'sort.name_desc' },
] as const;

/** Maps UI sort keys to Customer/fetch `SetOrder` (`asc` / `desc` for name). */
export function mapCustomerSetOrder(sortBy: CustomerSortKey | 'all'): string | undefined {
  if (sortBy === 'name-asc') return 'asc';
  if (sortBy === 'name-desc') return 'desc';
  return undefined;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

export interface UpdateCustomerDto extends CreateCustomerDto {
  readonly id: string;
  status: EntityStatus;
}
