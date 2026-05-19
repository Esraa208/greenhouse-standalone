import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SystemRow, CreateSystemDto, UpdateSystemDto } from '../models/system.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiSystemItem,
} from '@app/core/data-access/api';
import { PagedListQuery, PaginatedResult, buildPagedListParams, buildActiveSelectParams } from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class SystemsRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<SystemRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url, { params }).pipe(
      map(response => ({
        items: (response.result?.items ?? []).map(s => this.#mapToDomain(s)),
        totalCount: response.result?.totalCount ?? 0,
        pageNumber: response.result?.pageNumber ?? 1,
        pageSize: response.result?.pageSize ?? 50,
        totalPages: response.result?.totalPages ?? 1,
      }))
    );
  }

  fetchActivePage(pageNumber = 1): Observable<SystemRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(s => this.#mapToDomain(s)))
    );
  }

  create(dto: CreateSystemDto): Observable<SystemRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Create)}`;
    const payload = {
      systemdto: {
        name: dto.name,
        address: '',
        systemType: dto.type.toLowerCase() === 'nft' ? 1 : 2,
        locationId: Number(dto.locationId),
        unitId: Number(dto.greenhouseId),
        zoneId: Number(dto.zoneId),
      },
      currentUserId: 'system',
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
      systemType: dto.type.toLowerCase() === 'nft' ? 1 : 2,
      locationId: Number(dto.locationId),
      unitId: Number(dto.greenhouseId),
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
    const type = st === 2 ? 'DWC' : 'NFT';
    return {
      id: String(s.id),
      name: s.name ?? '',
      zoneId: s.zoneId != null ? String(s.zoneId) : '',
      zoneName: s.zoneName ?? '',
      greenhouseId: s.unitId != null ? String(s.unitId) : '',
      greenhouseName: s.unitName ?? '',
      locationId: s.locationId != null ? String(s.locationId) : '',
      locationName: s.locationName ?? '',
      type,
      status: s.active ? ('active' as const) : ('inactive' as const),
      layersCount: s.layersCount ?? s.systemsCount ?? 0,
      totalCapacity: s.capacity ?? 0,
      occupiedCapacity: s.used ?? 0,
    };
  }
}









