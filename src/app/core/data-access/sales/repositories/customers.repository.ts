import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CustomerRow, CreateCustomerDto } from '../models/customer.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiCustomerItem, ApiCreateCustomerCommand
} from '@app/core/data-access/api';

interface ApiCreateResponse { readonly id?: number; }

@Injectable({ providedIn: 'root' })
export class CustomersRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(): Observable<CustomerRow[]> {
    // Note: Swagger uses /api/Customer instead of /api/Customer/fetch
    const url = `${this.#apiUrl}/${ApiController.Customer}`;
    return this.#http.get<ApiPaginatedResult<ApiCustomerItem> | ApiCustomerItem[]>(url).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response as ApiPaginatedResult<ApiCustomerItem>).result?.items ?? [];
        return items.map(c => ({
          id: String(c.id),
          name: c.name ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
          address: c.address ?? '',
          invoicesCount: 0,
          totalPurchases: 0,
          createdAt: new Date().toISOString(),
        }));
      })
    );
  }

  getById(id: string): Observable<CustomerRow> {
    return this.getAll().pipe(
      map(items => {
        const item = items.find(c => c.id === id);
        if (!item) throw new Error('Customer not found');
        return item;
      })
    );
  }

  create(dto: CreateCustomerDto): Observable<CustomerRow> {
    const url = `${this.#apiUrl}/${ApiController.Customer}`;
    const payload: ApiCreateCustomerCommand = {
      customer: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email || '',
        address: dto.address || '',
      },
      currentUserId: 'system',
    };
    return this.#http.post<ApiCreateResponse>(url, payload).pipe(
      map(res => ({
        id: String(res?.id ?? Date.now()),
        name: dto.name,
        phone: dto.phone,
        email: dto.email || '',
        address: dto.address || '',
        invoicesCount: 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
      }))
    );
  }

  update(id: string, dto: Partial<CreateCustomerDto>): Observable<CustomerRow> {
    // Not provided in swagger, returning mock
    return this.getById(id).pipe(
      map(existing => ({ ...existing, ...dto } as CustomerRow))
    );
  }

  delete(id: string): Observable<void> {
    // Not provided in swagger
    const url = `${this.#apiUrl}/${ApiController.Customer}/${id}`;
    return this.#http.delete<void>(url);
  }
}










