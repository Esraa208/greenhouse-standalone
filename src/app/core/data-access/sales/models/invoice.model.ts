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
  readonly dueDate?: string;
  readonly paymentDate?: string;
  readonly isPaid: boolean;
  readonly status: InvoiceStatus;
  readonly pieceCount: number;
  readonly grossWeightKg: number;
  readonly netWeightKg: number;
  readonly rootWeightPerPlantKg?: number;
}

export type InvoiceSortKey =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'due-desc'
  | 'payment-desc';

export type InvoiceHasDueDateFilter = 'all' | 'yes' | 'no';

export interface InvoiceFilters {
  searchQuery: string;
  invoiceNumber: string;
  status: 'all' | 'paid' | 'pending';
  hasDueDate: InvoiceHasDueDateFilter;
  customerId: string;
  cropTypeId: string;
  stockBatchId: string;
  invoiceDateFrom: string;
  invoiceDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
  paymentDateFrom: string;
  paymentDateTo: string;
  minAmount: string;
  maxAmount: string;
  /** `'all'` = default server order (newest). */
  sortBy: InvoiceSortKey | 'all';
}

export const DEFAULT_INVOICE_FILTERS: InvoiceFilters = {
  searchQuery: '',
  invoiceNumber: '',
  status: 'all',
  hasDueDate: 'all',
  customerId: '',
  cropTypeId: '',
  stockBatchId: '',
  invoiceDateFrom: '',
  invoiceDateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
  paymentDateFrom: '',
  paymentDateTo: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'all',
};

function toDayStart(isoDate: string): string {
  return `${isoDate}T00:00:00`;
}

function toDayEnd(isoDate: string): string {
  return `${isoDate}T23:59:59`;
}

/** Maps UI filters → Invoice/fetch query params (excluding pagination/search/setOrder). */
export function buildInvoiceFetchExtraParams(
  f: InvoiceFilters,
): Record<string, string | number | boolean> {
  const extra: Record<string, string | number | boolean> = {};
  if (f.invoiceNumber.trim()) extra['InvoiceNumber'] = f.invoiceNumber.trim();
  if (f.customerId) extra['CustomerId'] = Number(f.customerId);
  if (f.cropTypeId) extra['CropTypeId'] = Number(f.cropTypeId);
  if (f.stockBatchId) extra['StockBatchId'] = Number(f.stockBatchId);
  if (f.status === 'paid') extra['IsPaid'] = true;
  if (f.status === 'pending') extra['IsPaid'] = false;
  if (f.hasDueDate === 'yes') extra['HasDueDate'] = true;
  if (f.hasDueDate === 'no') extra['HasDueDate'] = false;
  if (f.invoiceDateFrom) extra['InvoiceDateFrom'] = toDayStart(f.invoiceDateFrom);
  if (f.invoiceDateTo) extra['InvoiceDateTo'] = toDayEnd(f.invoiceDateTo);
  if (f.dueDateFrom) extra['DueDateFrom'] = toDayStart(f.dueDateFrom);
  if (f.dueDateTo) extra['DueDateTo'] = toDayEnd(f.dueDateTo);
  if (f.paymentDateFrom) extra['PaymentDateFrom'] = toDayStart(f.paymentDateFrom);
  if (f.paymentDateTo) extra['PaymentDateTo'] = toDayEnd(f.paymentDateTo);
  const min = Number(f.minAmount);
  if (f.minAmount.trim() && Number.isFinite(min)) extra['MinAmount'] = min;
  const max = Number(f.maxAmount);
  if (f.maxAmount.trim() && Number.isFinite(max)) extra['MaxAmount'] = max;
  return extra;
}

export const INVOICE_SORT_OPTIONS = [
  { value: 'date-desc', translationKey: 'sort.date_newest' },
  { value: 'date-asc', translationKey: 'sort.date_oldest' },
  { value: 'amount-desc', translationKey: 'sort.amount_desc' },
  { value: 'amount-asc', translationKey: 'sort.amount_asc' },
  { value: 'due-desc', translationKey: 'invoices.sort_due_desc' },
  { value: 'payment-desc', translationKey: 'invoices.sort_payment_desc' },
] as const;

/** Maps UI sort keys → API `SetOrder` for Invoice/fetch. */
export function mapInvoiceSetOrder(sortBy: InvoiceSortKey | 'all'): string | undefined {
  if (!sortBy || sortBy === 'all') return undefined;
  const map: Record<InvoiceSortKey, string> = {
    'date-desc': 'newest',
    'date-asc': 'oldest',
    'amount-desc': 'amountDesc',
    'amount-asc': 'amountAsc',
    'due-desc': 'dueDateDesc',
    'payment-desc': 'paymentDateDesc',
  };
  return map[sortBy];
}

export function resolveInvoiceStatus(isPaid: boolean, dueDate?: string): InvoiceStatus {
  if (isPaid) return 'paid';
  if (dueDate && new Date(dueDate).getTime() < Date.now()) return 'overdue';
  return 'pending';
}
