import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ZoneRow, CreateZoneDto, UpdateZoneDto } from '../models/zone.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiZoneItem,
} from '@app/core/data-access/api';
import { PagedListQuery, PaginatedResult, buildPagedListParams, buildActiveSelectParams } from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class ZonesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<ZoneRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url, { params }).pipe(
      map(response => ({
        items: (response.result?.items ?? []).map(z => this.#mapToDomain(z)),
        totalCount: response.result?.totalCount ?? 0,
        pageNumber: response.result?.pageNumber ?? 1,
        pageSize: response.result?.pageSize ?? 10,
        totalPages: response.result?.totalPages ?? 1,
      }))
    );
  }

  fetchActivePage(pageNumber = 1): Observable<ZoneRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(z => this.#mapToDomain(z)))
    );
  }

  create(dto: CreateZoneDto): Observable<ZoneRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Create)}`;
    const payload = {
      currentUserId: 'system',
      zonedto: {
        name: dto.name,
        address: '',
        locationId: Number(dto.locationId),
        unitId: Number(dto.greenhouseId),
      },
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        greenhouseId: dto.greenhouseId,
        greenhouseName: dto.greenhouseName ?? '',
        locationId: dto.locationId,
        locationName: dto.locationName ?? '',
        totalCapacity: 0,
        occupiedCapacity: 0,
        status: 'active' as const,
        systemsCount: 0,
      }))
    );
  }

  update(id: string, dto: UpdateZoneDto): Observable<PutPatch<ZoneRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Update)}`;
    const payload = { unitId: Number(dto.greenhouseId), name: dto.name, active: dto.status === 'active', address: '' };
    return this.#http.put<unknown>(url, payload, { params: { id: String(Number(id)) } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        greenhouseId: dto.greenhouseId || '',
        greenhouseName: dto.greenhouseName ?? '',
        locationId: dto.locationId || '',
        locationName: dto.locationName ?? '',
        status: dto.status || ('active' as const),
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

  #mapToDomain(z: ApiZoneItem): ZoneRow {
    const zr = z as ApiZoneItem & {
      readonly unitName?: string;
      readonly locationName?: string;
      readonly locationId?: number;
      readonly capacity?: number;
      readonly systemsCount?: number;
      readonly used?: number;
    };
    return {
      id: String(z.id),
      name: z.name ?? '',
      greenhouseId: String(z.unitId),
      greenhouseName: zr.unitName ?? '',
      locationId: zr.locationId != null ? String(zr.locationId) : '',
      locationName: zr.locationName ?? '',
      totalCapacity: zr.capacity ?? 0,
      occupiedCapacity: zr.used ?? 0,
      status: z.active ? ('active' as const) : ('inactive' as const),
      systemsCount: zr.systemsCount ?? 0,
    };
  }
}









