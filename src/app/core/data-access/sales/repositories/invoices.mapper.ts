import type { ApiInvoiceItem } from '@app/core/data-access/api';
import type { InvoiceItem, InvoiceRow } from '../models/invoice.model';
import { resolveInvoiceStatus } from '../models/invoice.model';

function pickString(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function mapSourcesToItems(api: ApiInvoiceItem): InvoiceItem[] {
  const sources = api.sources ?? [];
  if (sources.length > 0) {
    return sources.map((s, index) => ({
      id: String(index),
      cropName: pickString(s.cropType),
      quantity: s.pieceCount ?? 0,
      weightBeforeRoots: s.grossWeightKg ?? 0,
      weightAfterRoots: s.netWeightKg ?? 0,
      pricePerKg: s.pricePerKg ?? 0,
      total: s.totalAmount ?? 0,
    }));
  }

  return (api.items ?? []).map((item) => ({
    id: String(item.id),
    cropName: pickString(item.productName),
    quantity: item.quantityKg ?? 0,
    weightBeforeRoots: item.totalWeightKg ?? 0,
    weightAfterRoots: item.totalWeightKg ?? 0,
    pricePerKg: item.pricePerUnit ?? 0,
    total: item.total ?? 0,
  }));
}

export function mapInvoiceToRow(api: ApiInvoiceItem): InvoiceRow {
  const isPaid = api.payment?.isPaid ?? api.isPaid ?? false;
  const dueDate =
    api.dueDate != null && String(api.dueDate).trim() !== ''
      ? String(api.dueDate).trim()
      : undefined;
  const paymentDate = pickString(api.paymentDate) || undefined;

  return {
    id: String(api.id),
    invoiceNumber: pickString(api.invoiceNumber) || `INV-${api.id}`,
    customerId: String(api.customer?.id ?? api.customerId ?? ''),
    customerName: pickString(api.customer?.name, api.customerName),
    customerPhone: pickString(api.customer?.phone, api.customerPhone),
    items: mapSourcesToItems(api),
    total: api.totalAmount ?? 0,
    invoiceDate: pickString(api.invoiceDate) || new Date().toISOString(),
    dueDate,
    paymentDate,
    isPaid,
    status: resolveInvoiceStatus(isPaid, dueDate),
    pieceCount: api.pieceCount ?? 0,
    grossWeightKg: api.grossWeightKg ?? 0,
    netWeightKg: api.netWeightKg ?? 0,
    rootWeightPerPlantKg: api.rootWeightPerPlantKg,
  };
}
