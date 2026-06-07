import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ZoneRow, CreateZoneDto, UpdateZoneDto } from '../models/zone.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiZoneItem,
} from '@app/core/data-access/api';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildZoneSelectParams,
  normalizePaginatedResult,
} from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';
import { apiRefId, apiRefName, mapApiEntityStatus, readApiOccupancy } from '../api-entity-ref';

@Injectable({ providedIn: 'root' })
export class ZonesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<ZoneRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(z => this.#mapToDomain(z));
        return normalizePaginatedResult(response.result, items, query.pageSize);
      })
    );
  }

  fetchActivePage(pageNumber = 1): Observable<ZoneRow[]> {
    const params = buildZoneSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(z => this.#mapToDomain(z)))
    );
  }

  /** Active zones for one greenhouse (unit); API may omit `unitId` on list rows. */
  fetchActiveByUnit(unitId: string, pageNumber = 1): Observable<ZoneRow[]> {
    const params = { ...buildZoneSelectParams(pageNumber), UnitId: Number(unitId) };
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(z => this.#mapToDomain(z)))
    );
  }

  /** Active zones for one location — table-filter cascades when greenhouse is "all". */
  fetchActiveByLocation(locationId: string, pageNumber = 1): Observable<ZoneRow[]> {
    const params = { ...buildZoneSelectParams(pageNumber), LocationId: Number(locationId) };
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(z => this.#mapToDomain(z)))
    );
  }

  create(dto: CreateZoneDto): Observable<ZoneRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Create)}`;
    const payload = {
      currentUserId: 'system',
      zone: {
        name: dto.name,
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
    const payload = {
      unitId: Number(dto.greenhouseId),
      name: dto.name,
      active: dto.status === 'active',
    };
    return this.#http.put<unknown>(url, payload, { params: { id: Number(id) } }).pipe(
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
    const occ = readApiOccupancy(z.occupancy, {
      totalCapacity: z.capacity,
      used: z.used,
      percent: z.occupancyPercent,
    });
    return {
      id: String(z.id),
      name: z.name ?? '',
      greenhouseId: apiRefId(z.unit, z.unitId),
      greenhouseName: normalizeGreenhouseLabel(apiRefName(z.unit, z.unitName)),
      locationId: apiRefId(z.location, z.locationId),
      locationName: apiRefName(z.location, z.locationName),
      totalCapacity: occ.totalCapacity,
      occupiedCapacity: occ.used,
      occupancyPct: occ.percent,
      status: mapApiEntityStatus(z.status, z.active),
      systemsCount: z.systemsCount ?? 0,
    };
  }
}
