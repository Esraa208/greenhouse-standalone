import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BatchRow, CreateBatchDto, UpdateBatchDto } from '../models/batch.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildActiveSelectParams,
} from '../../infrastructure/list-query';
import { extractCreatedId } from '../../infrastructure/extract-created-id';
import type { PutPatch } from '../../infrastructure/put-patch-merge';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiBatchItem,
} from '@app/core/data-access/api';
import { mapBatchToRow, toApiCreateBatchCommand } from './batches.mapper';

@Injectable({ providedIn: 'root' })
export class BatchesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<BatchRow>> {
    const params = buildPagedListParams(query);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiBatchItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map((api) => mapBatchToRow(api));
        return {
          items,
          totalCount: response.result?.totalCount ?? 0,
          pageNumber: response.result?.pageNumber ?? 1,
          pageSize: response.result?.pageSize ?? 50,
          totalPages: response.result?.totalPages ?? 1,
        };
      })
    );
  }

  fetchActivePage(pageNumber = 1): Observable<BatchRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiBatchItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map((api) => mapBatchToRow(api)))
    );
  }

  create(dto: CreateBatchDto): Observable<BatchRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Create)}`;
    const payload = toApiCreateBatchCommand(dto);
    return this.#http.post<unknown>(url, payload).pipe(
      map((res) => ({
        id: String(extractCreatedId(res)),
        batchNumber: `BTH-${String(extractCreatedId(res)).padStart(3, '0')}`,
        name: dto.name,
        cropType: '',
        cropTypeId: dto.cropTypeId,
        quantity: dto.quantity,
        initialQuantity: dto.quantity,
        plantingDate: new Date().toISOString(),
        expectedHarvestDate: '',
        growthDuration: 0,
        daysPassed: 0,
        growthStageKey: 'seedlings',
        growthPercent: 0,
        status: 'active' as const,
        lossesCount: 0,
        lossesPercentage: 0,
      }))
    );
  }

  update(id: string, dto: UpdateBatchDto): Observable<PutPatch<BatchRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Update)}`;
    const payload = {
      cropTypeId: Number(dto.cropTypeId),
      quantity: dto.quantity,
      active: dto.status === 'active',
    };
    return this.#http.put<unknown>(url, payload, { params: { id } }).pipe(
      map(() => ({
        id,
        cropTypeId: dto.cropTypeId,
        quantity: dto.quantity,
        status: dto.status as 'active' | 'harvested' | 'lost',
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

}
