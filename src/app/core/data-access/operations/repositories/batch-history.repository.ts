import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  ApiController,
  ApiBatchHistoryItem,
  ApiHousingHistoryResponse,
  ApiPaginatedResult,
} from '@app/core/data-access/api';
import { normalizeAppError } from '@app/core/errors/app-error';
import type { HousingHistoryResult, StockHistoryEntry } from '../models/batch-history.model';
import {
  enrichStockHistoryEntries,
  mapBatchHistoryItem,
  mapHousingHistoryResponse,
  sortStockHistoryForDisplay,
} from './batch-history.mapper';

@Injectable({ providedIn: 'root' })
export class BatchHistoryRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getHousingHistory(housingId: string): Observable<HousingHistoryResult> {
    const url = `${this.#apiUrl}/${ApiController.BatchDistribution}/${housingId}/history`;
    return this.#http.get<ApiHousingHistoryResponse>(url).pipe(
      map((response) => mapHousingHistoryResponse(response.result)),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  getHistory(batchId: string): Observable<StockHistoryEntry[]> {
    const url = `${this.#apiUrl}/${ApiController.Batch}/history/${batchId}`;
    return this.#http.get<ApiPaginatedResult<ApiBatchHistoryItem> | ApiBatchHistoryItem[]>(url).pipe(
      map((response) => {
        const mapped = this.#extractItems(response).map((item) => mapBatchHistoryItem(item));
        return sortStockHistoryForDisplay(enrichStockHistoryEntries(mapped));
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err))),
    );
  }

  #extractItems(
    response: ApiPaginatedResult<ApiBatchHistoryItem> | ApiBatchHistoryItem[] | unknown,
  ): ApiBatchHistoryItem[] {
    if (Array.isArray(response)) return response;
    const wrapped = response as ApiPaginatedResult<ApiBatchHistoryItem>;
    if (Array.isArray(wrapped.result?.items)) return [...wrapped.result.items];
    const loose = response as { result?: ApiBatchHistoryItem[] | { items?: ApiBatchHistoryItem[] } };
    if (Array.isArray(loose.result)) return loose.result;
    if (loose.result && Array.isArray((loose.result as { items?: ApiBatchHistoryItem[] }).items)) {
      return [...(loose.result as { items: ApiBatchHistoryItem[] }).items];
    }
    return [];
  }
}
