import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SystemRow, CreateSystemDto, UpdateSystemDto } from '../models/system.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiSystemItem,
} from '@app/core/data-access/api';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildSystemSelectParams,
  normalizePaginatedResult,
} from '../list-query';
import { systemTypeToApiValue } from '../models/system.model';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';
import { apiRefId, apiRefName, mapApiEntityStatus, readApiOccupancy } from '../api-entity-ref';

@Injectable({ providedIn: 'root' })
export class SystemsRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<SystemRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(s => this.#mapToDomain(s));
        return normalizePaginatedResult(response.result, items, query.pageSize);
      })
    );
  }

  fetchActivePage(pageNumber = 1): Observable<SystemRow[]> {
    const params = buildSystemSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(s => this.#mapToDomain(s)))
    );
  }

  /** Active systems for one zone — modal/filter cascades. */
  fetchActiveByZone(zoneId: string, pageNumber = 1): Observable<SystemRow[]> {
    const params = { ...buildSystemSelectParams(pageNumber), ZoneId: Number(zoneId) };
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(s => this.#mapToDomain(s)))
    );
  }

  create(dto: CreateSystemDto): Observable<SystemRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Create)}`;
    const payload = {
      currentUserId: 'system',
      system: {
        name: dto.name,
        systemType: this.#systemTypeApiValue(dto.type),
        zoneId: Number(dto.zoneId),
      },
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        zoneId: dto.zoneId,
        zoneName: dto.zoneName ?? '',
        greenhouseId: dto.greenhouseId,
        greenhouseName: dto.greenhouseName ?? '',
        locationId: dto.locationId,
        locationName: dto.locationName ?? '',
        type: dto.type,
        status: 'active' as const,
        layersCount: 0,
        totalCapacity: 0,
        occupiedCapacity: 0,
      }))
    );
  }

  update(id: string, dto: UpdateSystemDto): Observable<PutPatch<SystemRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Update)}`;
    const payload = {
      name: dto.name,
      active: dto.status === 'active',
      systemType: this.#systemTypeApiValue(dto.type),
      zoneId: Number(dto.zoneId),
    };
    return this.#http.put<unknown>(url, payload, { params: { id } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        zoneId: dto.zoneId || '',
        zoneName: dto.zoneName ?? '',
        greenhouseId: dto.greenhouseId || '',
        greenhouseName: dto.greenhouseName ?? '',
        locationId: dto.locationId || '',
        locationName: dto.locationName ?? '',
        type: dto.type || 'NFT',
        status: dto.status || ('active' as const),
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

  #mapToDomain(s: ApiSystemItem): SystemRow {
    const st = s.systemType;
    let type = 'NFT';
    if (typeof st === 'object' && st != null) {
      type = st.value === 2 ? 'DWC' : 'NFT';
    } else if (st === 2) {
      type = 'DWC';
    }
    const occ = readApiOccupancy(s.occupancy, {
      totalCapacity: s.capacity,
      used: s.used,
      percent: s.occupancyPercent,
    });
    return {
      id: String(s.id),
      name: s.name ?? '',
      zoneId: apiRefId(s.zone, s.zoneId),
      zoneName: apiRefName(s.zone, s.zoneName),
      greenhouseId: apiRefId(s.unit, s.unitId),
      greenhouseName: normalizeGreenhouseLabel(apiRefName(s.unit, s.unitName)),
      locationId: apiRefId(s.location, s.locationId),
      locationName: apiRefName(s.location, s.locationName),
      type,
      status: mapApiEntityStatus(s.status, s.active),
      layersCount: s.layersCount ?? s.systemsCount ?? 0,
      totalCapacity: occ.totalCapacity,
      occupiedCapacity: occ.used,
      occupancyPct: occ.percent,
    };
  }

  #systemTypeApiValue(type: string): number {
    return systemTypeToApiValue(type) ?? 1;
  }
}









