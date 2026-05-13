import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BatchRow, CreateBatchDto } from '../models/batch.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import { normalizeAppError } from '@app/core/errors/app-error';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiBatchItem, ApiFetchParams, ApiCreateBatchCommand,
} from '@app/core/data-access/api';

@Injectable({ providedIn: 'root' })
export class BatchesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(pageNumber = 1, search = '', active = true): Observable<BatchRow[]> {
    const params: ApiFetchParams = {
      PageNumber: pageNumber,
      ...(search ? { Search: search } : {}),
      Active: active,
    };

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiBatchItem>>(url, { params: params as Record<string, string | number | boolean> }).pipe(
      map(response => {
        const items = response.result?.items ?? [];
        return items.map(apiBatch => this.#mapToDomain(apiBatch));
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getById(id: string): Observable<BatchRow> {
    return this.getAll().pipe(
      map(items => {
        const found = items.find(i => i.id === id);
        if (!found) throw new Error(`Batch with id ${id} not found`);
        return found;
      })
    );
  }

  create(dto: CreateBatchDto): Observable<BatchRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Create)}`;
    const payload: ApiCreateBatchCommand = {
      batch: {
        name: `BTH-${Date.now()}`,
        cropTypeId: Number(dto.cropTypeId),
        quantity: dto.quantity,
        pipeId: Number(dto.pipeId),
      },
      currentUserId: 'system',
    };
    return this.#http.post<ApiPaginatedResult<ApiBatchItem> | ApiBatchItem>(url, payload).pipe(
      map(response => {
        // API may return the created item directly or wrapped
        const apiBatch = 'result' in response
          ? (response as ApiPaginatedResult<ApiBatchItem>).result?.items?.[0]
          : response as ApiBatchItem;

        if (apiBatch) return this.#mapToDomain(apiBatch);

        // Fallback if API returns empty
        return {
          id: String(Date.now()),
          batchNumber: 'PENDING',
          cropType: '',
          cropTypeId: dto.cropTypeId,
          location: '',
          greenhouse: '',
          locationId: dto.locationId,
          greenhouseId: dto.greenhouseId,
          quantity: dto.quantity,
          initialQuantity: dto.quantity,
          plantingDate: dto.plantedDate,
          growthDurationDays: 30,
          status: 'active' as const,
          allocationsCount: 0,
          totalLosses: 0,
          plantedDate: dto.plantedDate,
          expectedHarvestDate: '',
          zone: '',
          growthStage: 'Starting',
          daysElapsed: 0,
          totalDays: 30,
        };
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } }).pipe(
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  /** Map API batch item to domain BatchRow */
  #mapToDomain(apiBatch: ApiBatchItem): BatchRow {
    const plantingDate = apiBatch.plantingDate || new Date().toISOString();
    const duration = apiBatch.growthDuration || 30;
    const elapsed = apiBatch.daysPassed || Math.max(0,
      Math.floor((Date.now() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      id: String(apiBatch.id),
      batchNumber: `BTH-${String(apiBatch.id).padStart(3, '0')}`,
      cropType: apiBatch.cropTypeName || 'Unknown',
      cropTypeId: String(apiBatch.cropTypeId),
      location: '',
      greenhouse: '',
      locationId: '',
      greenhouseId: '',
      quantity: apiBatch.quantity,
      initialQuantity: apiBatch.quantity,
      plantingDate,
      growthDurationDays: duration,
      status: apiBatch.active ? 'active' : 'harvested',
      allocationsCount: 0,
      totalLosses: 0,
      plantedDate: plantingDate.split('T')[0],
      expectedHarvestDate: new Date(
        new Date(plantingDate).getTime() + duration * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      zone: '',
      growthStage: elapsed >= duration ? 'Ready for Harvest' : 'Growing',
      daysElapsed: Math.max(0, elapsed),
      totalDays: duration,
    };
  }
}










