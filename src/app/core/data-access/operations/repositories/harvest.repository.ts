import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { HarvestRow, CreateHarvestDto, HarvestRefCustomer } from '../models/harvest.model';
import {
  API_BASE_URL,
  PaginatedResult,
  PagedListQuery,
  buildPagedListParams,
  normalizePaginatedResult,
} from '@app/core/data-access/infrastructure';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiHarvestItem, ApiCreateHarvestDto, ApiCustomerItem
} from '@app/core/data-access/api';

interface ApiCreateResponse { readonly id?: number; }

@Injectable({ providedIn: 'root' })
export class HarvestRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<HarvestRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Harvest, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiHarvestItem> | ApiHarvestItem[]>(url, { params }).pipe(
      map(response => {
        const rawItems = Array.isArray(response) ? response : (response as ApiPaginatedResult<ApiHarvestItem>).result?.items ?? [];
        const items = rawItems.map(apiHarvest => ({
          id: String(apiHarvest.id),
          batchNumber: `BTH-${apiHarvest.stockBatchId}`,
          cropTypeName: '',
          quantityHarvested: apiHarvest.totalQuantity || 0,
          rootWeight: 0,
          netWeight: apiHarvest.netWeight || 0,
          harvestValue: apiHarvest.value || 0,
          harvestDate: apiHarvest.date || new Date().toISOString(),
          customerName: '',
        }));
        const paginated = !Array.isArray(response)
          ? (response as ApiPaginatedResult<ApiHarvestItem>).result
          : null;
        return normalizePaginatedResult(paginated, items, query.pageSize);
      })
    );
  }

  getById(id: string): Observable<HarvestRow> {
    return this.getAll().pipe(
      map(result => {
        const row = result.items.find((m) => m.id === id);
        if (!row) throw new Error('Harvest not found');
        return row;
      })
    );
  }

  create(dto: CreateHarvestDto): Observable<HarvestRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Harvest, ApiAction.Create)}`;
    const payload: ApiCreateHarvestDto = {
      stockBatchId: 0, // We need this from the context, defaulting to 0
      date: new Date().toISOString(),
      totalQuantity: dto.allocations.reduce((sum, a) => sum + a.harvestQuantity, 0),
      netWeight: dto.totalWeight,
      value: dto.totalWeight * dto.pricePerKg,
      notes: dto.notes || '',
      details: dto.allocations.map(a => ({
        layerId: Number(a.allocationId), // Assuming allocationId maps to layerId in this context
        quantity: a.harvestQuantity,
        netWeight: 0, // Approximate or leave 0
        unit: 'kg',
      })),
    };
    return this.#http.post<ApiCreateResponse>(url, payload).pipe(
      map(res => ({
        id: String(res?.id ?? Date.now()),
        batchNumber: '',
        cropTypeName: '',
        quantityHarvested: payload.totalQuantity,
        rootWeight: dto.hasRoots ? (dto.rootWeightPerPlantGrams || 0) * 0.001 : 0,
        netWeight: payload.netWeight,
        harvestValue: payload.value,
        harvestDate: payload.date,
        customerName: '',
      }))
    );
  }

  update(id: string, dto: CreateHarvestDto): Observable<HarvestRow> {
    return this.getById(id);
  }

  delete(id: string): Observable<void> {
    // API endpoint doesn't exist yet
    const url = `${this.#apiUrl}/${ApiController.Harvest}/${id}`;
    return this.#http.delete<void>(url);
  }

  getCustomers(): Observable<HarvestRefCustomer[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Customer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiCustomerItem>>(url, { params: { PageNumber: 1 } }).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response as ApiPaginatedResult<ApiCustomerItem>).result?.items ?? [];
        return items.map(c => ({
          id: String(c.id),
          name: c.name || '',
          phone: c.phone || '',
        }));
      })
    );
  }
}










