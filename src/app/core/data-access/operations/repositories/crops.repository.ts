import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateCropDto, CropRow, UpdateCropDto } from '../models/crop.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildActiveSelectParams,
} from '../../infrastructure/list-query';
import { extractCreatedId } from '../../infrastructure/extract-created-id';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiCropTypeItem,
} from '@app/core/data-access/api';

@Injectable({ providedIn: 'root' })
export class CropsRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<CropRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.CropType, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiCropTypeItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(apiCrop => ({
          id: String(apiCrop.id),
          name: apiCrop.name,
          growthDuration: 30,
          activeBatches: apiCrop.activeStocs ?? 0,
          totalPlants: apiCrop.cropCounts ?? 0,
        }));
        return {
          items,
          totalCount: response.result?.totalCount ?? 0,
          pageNumber: response.result?.pageNumber ?? 1,
          pageSize: response.result?.pageSize ?? 10,
          totalPages: response.result?.totalPages ?? 1,
        };
      })
    );
  }

  /** Dropdowns / selects: active crop types only. */
  fetchActivePage(pageNumber = 1): Observable<CropRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.CropType, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiCropTypeItem>>(url, { params }).pipe(
      map(response => {
        const items = response.result?.items ?? [];
        return items.map(apiCrop => ({
            id: String(apiCrop.id),
            name: apiCrop.name,
            growthDuration: 30,
            activeBatches: apiCrop.activeStocs ?? 0,
            totalPlants: apiCrop.cropCounts ?? 0,
          }));
      })
    );
  }

  getById(id: string): Observable<CropRow> {
    return this.getAll().pipe(
      map(result => {
        const found = result.items.find(i => i.id === id);
        if (!found) throw new Error(`Crop with id ${id} not found`);
        return found;
      })
    );
  }

  create(dto: CreateCropDto): Observable<CropRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.CropType, ApiAction.Create)}`;
    const payload = {
      currentCropType: {
        name: dto.name,
        growthDuration: dto.growthDuration,
      },
      currentUserId: 'system',
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map((res) => ({
        id: String(extractCreatedId(res)),
        name: dto.name,
        growthDuration: dto.growthDuration,
        activeBatches: 0,
        totalPlants: 0,
      }))
    );
  }

  update(id: string, dto: UpdateCropDto): Observable<CropRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.CropType, ApiAction.Update)}`;
    const payload = {
      name: dto.name,
      growthDuration: dto.growthDuration,
    };
    return this.#http.put<unknown>(url, payload, { params: { id } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        growthDuration: dto.growthDuration || 30,
        activeBatches: 0,
        totalPlants: 0,
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.CropType, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }
}










