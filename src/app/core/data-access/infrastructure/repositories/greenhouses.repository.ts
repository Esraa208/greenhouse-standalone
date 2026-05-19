import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GreenhouseRow, CreateGreenhouseDto, UpdateGreenhouseDto } from '../models/greenhouse.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiUnitItem,
} from '@app/core/data-access/api';
import { PagedListQuery, PaginatedResult, buildPagedListParams, buildActiveSelectParams } from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class GreenhousesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<GreenhouseRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url, { params }).pipe(
      map(response => ({
        items: (response.result?.items ?? []).map(u => this.#mapToDomain(u)),
        totalCount: response.result?.totalCount ?? 0,
        pageNumber: response.result?.pageNumber ?? 1,
        pageSize: response.result?.pageSize ?? 50,
        totalPages: response.result?.totalPages ?? 1,
      }))
    );
  }

  getByLocation(locationId: string): Observable<GreenhouseRow[]> {
    const params: Record<string, string | number | boolean> = { LocationId: locationId, Active: true };
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(u => this.#mapToDomain(u)))
    );
  }

  fetchActivePage(pageNumber = 1): Observable<GreenhouseRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(u => this.#mapToDomain(u)))
    );
  }

  create(dto: CreateGreenhouseDto): Observable<GreenhouseRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Create)}`;
    const payload = {
      currentUserId: 'system',
      unit: {
        name: dto.name,
        address: '',
        locationId: Number(dto.locationId),
      },
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        locationId: dto.locationId,
        locationName: dto.locationName ?? '',
        status: 'active' as const,
        zonesCount: 0,
        totalCapacity: 0,
        occupiedCapacity: 0,
      }))
    );
  }

  update(id: string, dto: UpdateGreenhouseDto): Observable<PutPatch<GreenhouseRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Update)}`;
    const payload = {
      locationId: Number(dto.locationId),
      address: '',
      active: dto.status === 'active',
      name: dto.name,
    };
    return this.#http.put<unknown>(url, payload, { params: { id: String(Number(id)) } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        locationId: dto.locationId || '',
        locationName: dto.locationName ?? '',
        status: dto.status || ('active' as const),
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

  #mapToDomain(u: ApiUnitItem): GreenhouseRow {
    return {
      id: String(u.id),
      name: u.name ?? '',
      locationId: String(u.locationId),
      locationName: u.locationName ?? '',
      status: u.active ? 'active' : 'inactive',
      zonesCount: u.zonesCount ?? 0,
      totalCapacity: u.capacity ?? 0,
      occupiedCapacity: u.used ?? 0,
    };
  }
}









