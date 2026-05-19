import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LocationRow, CreateLocationDto, UpdateLocationDto } from '../models/location.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiLocationItem,
} from '@app/core/data-access/api';
import { PagedListQuery, PaginatedResult, buildPagedListParams, buildActiveSelectParams } from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class LocationsRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<LocationRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLocationItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(apiLoc => ({
          id: String(apiLoc.id),
          name: apiLoc.name ?? '',
          address: apiLoc.address ?? '',
          unitsCount: apiLoc.unitsCount ?? 0,
          totalCapacity: apiLoc.totalCapacity ?? 0,
          status: apiLoc.active ? 'active' as const : 'inactive' as const,
        }));
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

  /** Active rows only (dropdowns / modals). */
  fetchActivePage(pageNumber = 1): Observable<LocationRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLocationItem>>(url, { params }).pipe(
      map(response => {
        const items = response.result?.items ?? [];
        return items.map(apiLoc => ({
          id: String(apiLoc.id),
          name: apiLoc.name ?? '',
          address: apiLoc.address ?? '',
          unitsCount: apiLoc.unitsCount ?? 0,
          totalCapacity: apiLoc.totalCapacity ?? 0,
          status: apiLoc.active ? 'active' as const : 'inactive' as const,
        }));
      })
    );
  }

  create(dto: CreateLocationDto): Observable<LocationRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Create)}`;
    const payload = { name: dto.name, address: dto.address, currentUserId: 'system' };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        address: dto.address,
        unitsCount: 0,
        totalCapacity: 0,
        status: 'active' as const,
      }))
    );
  }

  update(id: string, dto: UpdateLocationDto): Observable<PutPatch<LocationRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Update)}`;
    const payload = { name: dto.name, address: dto.address, active: dto.status === 'active' };
    return this.#http.put<unknown>(url, payload, { params: { id } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        address: dto.address || '',
        status: dto.status || 'active' as const,
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }
}









