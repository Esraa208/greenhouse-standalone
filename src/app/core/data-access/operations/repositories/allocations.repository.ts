import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AllocationRow, MoveAllocationDto } from '../models/allocation.model';
import { API_BASE_URL, PaginatedResult } from '@app/core/data-access/infrastructure';
import { normalizePaginatedResult } from '../../infrastructure/list-query';
import { normalizeAppError } from '@app/core/errors/app-error';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiDistributionItem,
  ApiMoveBatchDto,
  ApiDistributionFetchParams,
} from '@app/core/data-access/api';
import { mapDistributionToRow } from './allocations.mapper';

@Injectable({ providedIn: 'root' })
export class AllocationsRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(
    pageNumber = 1,
    search = '',
    filters?: Partial<ApiDistributionFetchParams>,
    pageSize?: number,
  ): Observable<PaginatedResult<AllocationRow>> {
    const params: Record<string, string | number | boolean> = { PageNumber: pageNumber };
    if (pageSize != null && pageSize > 0) params['PageSize'] = pageSize;
    if (search) params['Search'] = search;
    if (filters?.LocationId) params['LocationId'] = filters.LocationId;
    if (filters?.UnitId) params['UnitId'] = filters.UnitId;
    if (filters?.ZoneId) params['ZoneId'] = filters.ZoneId;
    if (filters?.SystemId) params['SystemId'] = filters.SystemId;
    if (filters?.LayerId) params['LayerId'] = filters.LayerId;
    // Pipe/fetch disabled — pipe filter removed from allocations UI
    // if (filters?.PipeId) params['PipeId'] = filters.PipeId;
    if (filters?.StockBatchId) params['StockBatchId'] = filters.StockBatchId;
    if (filters?.Status) params['Status'] = filters.Status;
    if (filters?.SetOrder) params['SetOrder'] = filters.SetOrder;

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.BatchDistribution, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiDistributionItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map((dist) => mapDistributionToRow(dist));
        return normalizePaginatedResult(response.result, items, pageSize);
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getById(id: string): Observable<AllocationRow> {
    return this.getAll().pipe(
      map(result => {
        const found = result.items.find(i => i.id === id);
        if (!found) throw new Error(`Allocation with id ${id} not found`);
        return found;
      })
    );
  }

  move(dto: MoveAllocationDto): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.BatchDistribution, ApiAction.Move)}`;
    const payload: ApiMoveBatchDto = {
      housingId: Number(dto.allocationId),
      quantity: dto.quantity,
      layerId: Number(dto.targetLayerId),
    };
    return this.#http.put<unknown>(url, payload).pipe(
      map(() => undefined),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.BatchDistribution, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } }).pipe(
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  // ─── Private helpers ───────────────────────────────────────
}










