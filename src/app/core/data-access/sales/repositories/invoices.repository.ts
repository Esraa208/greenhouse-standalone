import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import type { InvoiceRow } from '../models/invoice.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  ApiController,
  ApiAction,
  getEndpoint,
  ApiPaginatedResult,
  ApiInvoiceItem,
} from '@app/core/data-access/api';
import type {
  ApiMarkInvoicePaidCommand,
  ApiUpdateInvoiceDueDateCommand,
  ApiCreateInvoiceCommand,
} from '@app/core/models/api-types';
import { extractCreatedId } from '@app/core/data-access/infrastructure/extract-created-id';
import { mapCreateInvoiceToApi } from './invoice-create.mapper';
import type { CreateInvoiceFromHarvestDto } from '../models/invoice-create.model';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  normalizePaginatedResult,
} from '@app/core/data-access/infrastructure/list-query';
import { normalizeAppError } from '@app/core/errors/app-error';
import { mapInvoiceToRow } from './invoices.mapper';
import { dateInputToApiDateTime } from '../utils/invoice-date.util';

@Injectable({ providedIn: 'root' })
export class InvoicesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<InvoiceRow>> {
    const params = buildPagedListParams(query);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Invoice, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiInvoiceItem>>(url, { params }).pipe(
      map((response) => {
        const items = (response.result?.items ?? []).map(mapInvoiceToRow);
        return normalizePaginatedResult(response.result, items, query.pageSize);
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  getById(id: string): Observable<InvoiceRow> {
    const params: Record<string, string | number> = {
      PageNumber: 1,
      InvoiceId: Number(id),
    };
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Invoice, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiInvoiceItem>>(url, { params }).pipe(
      map((response) => {
        const api = response.result?.items?.[0];
        if (!api) throw new Error(`Invoice with id ${id} not found`);
        return mapInvoiceToRow(api);
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  markAsPaid(invoiceId: string, paymentDate: string): Observable<InvoiceRow> {
    const url = `${this.#apiUrl}/${ApiController.Invoice}/mark-paid`;
    const body: ApiMarkInvoicePaidCommand = {
      currentUserId: 'system',
      invoiceId: Number(invoiceId),
      paymentDate,
    };
    return this.#http.post<ApiInvoiceItem | unknown>(url, body).pipe(
      switchMap((res) => this.#mapMutationResponse(res, invoiceId)),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  updateDueDate(invoiceId: string, dueDate: string | null): Observable<InvoiceRow> {
    const url = `${this.#apiUrl}/${ApiController.Invoice}/due-date`;
    const body: ApiUpdateInvoiceDueDateCommand = {
      currentUserId: 'system',
      invoiceId: Number(invoiceId),
      dueDate,
    };
    return this.#http.post<ApiInvoiceItem | unknown>(url, body).pipe(
      switchMap((res) => this.#mapMutationResponse(res, invoiceId)),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  /** Accepts `YYYY-MM-DD` from a date input. */
  markAsPaidFromDateInput(invoiceId: string, dateInput: string): Observable<InvoiceRow> {
    return this.markAsPaid(invoiceId, dateInputToApiDateTime(dateInput));
  }

  /** Accepts `YYYY-MM-DD` from a date input, or `null` to clear. */
  updateDueDateFromDateInput(invoiceId: string, dateInput: string | null): Observable<InvoiceRow> {
    const dueDate = dateInput ? dateInputToApiDateTime(dateInput) : null;
    return this.updateDueDate(invoiceId, dueDate);
  }

  createFromHarvest(dto: CreateInvoiceFromHarvestDto): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Invoice, ApiAction.Create)}`;
    const body = mapCreateInvoiceToApi(dto);
    return this.#http.post<unknown>(url, body).pipe(
      switchMap((res) => {
        try {
          const id = extractCreatedId(res);
          return this.getById(id).pipe(map(() => undefined));
        } catch {
          return of(undefined);
        }
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  #mapMutationResponse(res: unknown, invoiceId: string): Observable<InvoiceRow> {
    if (res && typeof res === 'object' && 'id' in (res as object)) {
      return of(mapInvoiceToRow(res as ApiInvoiceItem));
    }
    return this.getById(invoiceId);
  }
}
