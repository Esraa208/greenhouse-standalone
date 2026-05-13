import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InvoiceRow } from '../models/invoice.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  ApiController, ApiPaginatedResult, ApiInvoiceItem
} from '@app/core/data-access/api';

@Injectable({ providedIn: 'root' })
export class InvoicesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(customerId?: string): Observable<InvoiceRow[]> {
    const params: Record<string, string | number> = {};
    if (customerId) params['customerId'] = Number(customerId);

    const url = `${this.#apiUrl}/${ApiController.Invoice}`;
    return this.#http.get<ApiPaginatedResult<ApiInvoiceItem> | ApiInvoiceItem[]>(url, { params }).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response as ApiPaginatedResult<ApiInvoiceItem>).result?.items ?? [];
        return items.map(apiInv => ({
          id: String(apiInv.id),
          invoiceNumber: apiInv.invoiceNumber || `INV-${apiInv.id}`,
          customerId: String(apiInv.customerId),
          customerName: apiInv.customerName || '',
          customerPhone: apiInv.customerPhone || '',
          items: (apiInv.items || []).map(item => ({
            id: String(item.id),
            cropName: item.productName || '',
            quantity: item.quantityKg || 0,
            weightBeforeRoots: item.totalWeightKg || 0,
            weightAfterRoots: item.totalWeightKg || 0, // Using same for now
            pricePerKg: item.pricePerUnit || 0,
            total: item.total || 0,
          })),
          total: apiInv.totalAmount || 0,
          invoiceDate: apiInv.invoiceDate || new Date().toISOString(),
          collectionDate: apiInv.dueDate || apiInv.paymentDate || new Date().toISOString(),
          actualCollectionDate: apiInv.paymentDate,
          status: (apiInv.status || 'pending') as InvoiceRow['status'],
        }));
      })
    );
  }

  getById(id: string): Observable<InvoiceRow> {
    return this.getAll().pipe(
      map(items => {
        const item = items.find(i => i.id === id);
        if (!item) throw new Error('Invoice not found');
        return item;
      })
    );
  }

  markAsPaid(id: string): Observable<InvoiceRow> {
    // API endpoint doesn't exist yet, mock returning updated status
    return this.getById(id).pipe(
      map(item => ({
        ...item,
        status: 'paid' as const,
        actualCollectionDate: new Date().toISOString(),
      }))
    );
  }
}










