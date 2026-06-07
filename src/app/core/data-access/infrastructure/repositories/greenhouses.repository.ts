import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GreenhouseRow, CreateGreenhouseDto, UpdateGreenhouseDto } from '../models/greenhouse.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiUnitItem,
} from '@app/core/data-access/api';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildUnitSelectParams,
  normalizePaginatedResult,
} from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';

/** Fallback when address is omitted (legacy rows). */
const UNIT_ADDRESS_PLACEHOLDER = '.';

@Injectable({ providedIn: 'root' })
export class GreenhousesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  #unitAddress(address?: string): string {
    const trimmed = address?.trim();
    return trimmed ? trimmed : UNIT_ADDRESS_PLACEHOLDER;
  }

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<GreenhouseRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(u => this.#mapToDomain(u));
        return normalizePaginatedResult(response.result, items, query.pageSize);
      })
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
    const params = buildUnitSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(u => this.#mapToDomain(u)))
    );
  }

  /** Active units for one location — modal/filter cascades. */
  fetchActiveByLocation(locationId: string, pageNumber = 1): Observable<GreenhouseRow[]> {
    const params = { ...buildUnitSelectParams(pageNumber), LocationId: Number(locationId) };
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
        address: this.#unitAddress(dto.address),
        locationId: Number(dto.locationId),
      },
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        address: this.#unitAddress(dto.address),
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
      address: this.#unitAddress(dto.address),
      active: dto.status === 'active',
      name: dto.name,
    };
    return this.#http.put<unknown>(url, payload, { params: { id: String(Number(id)) } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        address: this.#unitAddress(dto.address),
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
    const isActive = u.status?.isActive ?? u.active ?? true;
    const occ = u.occupancy;
    const totalCapacity = occ?.totalCapacity ?? u.capacity ?? 0;
    const used = occ?.used ?? u.used ?? 0;
    const occupancyPct = occ?.percent ?? u.occupancyPercent;
    return {
      id: String(u.id),
      name: normalizeGreenhouseLabel(u.name),
      address: u.address?.trim() ?? '',
      locationId: String(u.location?.id ?? u.locationId ?? ''),
      locationName: u.location?.name ?? u.locationName ?? '',
      status: isActive ? 'active' : 'inactive',
      zonesCount: u.zonesCount ?? 0,
      totalCapacity,
      occupiedCapacity: used,
      occupancyPct,
    };
  }
}









