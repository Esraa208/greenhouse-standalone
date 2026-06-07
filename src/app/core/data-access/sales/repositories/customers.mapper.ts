import type { ApiCustomerItem } from '@app/core/data-access/api';
import type { CustomerRow } from '../models/customer.model';
import type { EntityStatus } from '../../infrastructure/models/location.model';

function pickString(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function readIsActive(api: ApiCustomerItem): boolean {
  if (api.status?.isActive != null) return api.status.isActive;
  if (api.active != null) return api.active;
  return true;
}

export function mapCustomerToRow(api: ApiCustomerItem): CustomerRow {
  const isActive = readIsActive(api);
  const status: EntityStatus = isActive ? 'active' : 'inactive';

  return {
    id: String(api.id),
    name: pickString(api.name),
    phone: pickString(api.contact?.phone, api.phone),
    email: pickString(api.contact?.email, api.email) || undefined,
    address: pickString(api.contact?.address, api.address) || undefined,
    status,
    invoicesCount: api.purchases?.invoiceCount ?? api.invoiceCount ?? 0,
    totalPurchases: api.purchases?.totalAmount ?? api.totalPurchases ?? 0,
    createdAt: pickString(api.creationDate) || new Date().toISOString(),
  };
}
