import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CustomerRow, CreateCustomerDto, UpdateCustomerDto } from '../models/customer.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiCustomerItem, ApiCreateCustomerCommand,
} from '@app/core/data-access/api';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildTableFetchParams,
  normalizePaginatedResult,
} from '@app/core/data-access/infrastructure/list-query';
import { extractCreatedId } from '@app/core/data-access/infrastructure/extract-created-id';
import type { PutPatch } from '@app/core/data-access/infrastructure/put-patch-merge';
import { mapCustomerToRow } from './customers.mapper';

@Injectable({ providedIn: 'root' })
export class CustomersRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<CustomerRow>> {
    const params = buildPagedListParams(query);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Customer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiCustomerItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(mapCustomerToRow);
        return normalizePaginatedResult(response.result, items, query.pageSize);
      })
    );
  }

  /** Dropdowns: pagination only — no `PageSize` (server default). */
  fetchSelectPage(pageNumber = 1): Observable<CustomerRow[]> {
    const params = buildTableFetchParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Customer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiCustomerItem>>(url, { params }).pipe(
      map((response) => (response.result?.items ?? []).map(mapCustomerToRow)),
    );
  }

  create(dto: CreateCustomerDto): Observable<CustomerRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Customer, ApiAction.Create)}`;
    const payload: ApiCreateCustomerCommand = {
      currentUserId: 'system',
      customer: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email || '',
        address: dto.address || '',
      },
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        phone: dto.phone,
        email: dto.email || '',
        address: dto.address || '',
        status: 'active' as const,
        invoicesCount: 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
      }))
    );
  }

  update(id: string, dto: UpdateCustomerDto): Observable<PutPatch<CustomerRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Customer, ApiAction.Update)}`;
    const payload = {
      name: dto.name,
      phone: dto.phone,
      email: dto.email || '',
      address: dto.address || '',
      active: dto.status === 'active',
    };
    return this.#http.put<unknown>(url, payload, { params: { id } }).pipe(
      map(() => ({
        id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email || '',
        address: dto.address || '',
        status: dto.status,
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Customer, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }
}
