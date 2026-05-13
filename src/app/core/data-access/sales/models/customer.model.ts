export interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email?: string;
  readonly address?: string;
  readonly invoicesCount: number;
  readonly totalPurchases: number;
  readonly createdAt: string;
}

export type CustomerSortKey =
  | 'date-desc' | 'date-asc'
  | 'name-asc'  | 'name-desc'
  | 'purchases-desc';

export interface CustomerFilters {
  searchQuery: string;
  sortBy: CustomerSortKey;
}

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilters = {
  searchQuery: '',
  sortBy: 'date-desc',
};

export const CUSTOMER_SORT_OPTIONS = [
  { value: 'date-desc',      translationKey: 'sort.date_newest'      },
  { value: 'date-asc',       translationKey: 'sort.date_oldest'      },
  { value: 'name-asc',       translationKey: 'sort.name_asc'         },
  { value: 'name-desc',      translationKey: 'sort.name_desc'        },
  { value: 'purchases-desc', translationKey: 'sort.purchases_desc'   },
] as const;

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}





