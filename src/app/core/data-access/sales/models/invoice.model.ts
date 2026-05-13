export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface InvoiceItem {
  readonly id: string;
  readonly cropName: string;
  readonly quantity: number;
  readonly weightBeforeRoots: number;
  readonly weightAfterRoots: number;
  readonly pricePerKg: number;
  readonly total: number;
}

export interface InvoiceRow {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly items: readonly InvoiceItem[];
  readonly total: number;
  readonly invoiceDate: string;
  readonly collectionDate: string;
  readonly actualCollectionDate?: string;
  readonly status: InvoiceStatus;
}

export type InvoiceSortKey = 'date-desc' | 'date-asc' | 'amount-desc';

export interface InvoiceFilters {
  searchQuery: string;
  status: InvoiceStatus | 'all';
  customerId: string;
  dateFrom: string;
  dateTo: string;
  sortBy: InvoiceSortKey;
}

export const DEFAULT_INVOICE_FILTERS: InvoiceFilters = {
  searchQuery: '',
  status: 'all',
  customerId: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date-desc',
};

export const INVOICE_SORT_OPTIONS = [
  { value: 'date-desc',   translationKey: 'sort.date_newest'    },
  { value: 'date-asc',    translationKey: 'sort.date_oldest'    },
  { value: 'amount-desc', translationKey: 'sort.amount_desc'    },
] as const;





