import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LayerRow, CreateLayerDto, UpdateLayerDto } from '../models/layer.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiLayerItem,
} from '@app/core/data-access/api';
import { PagedListQuery, PaginatedResult, buildPagedListParams, buildActiveSelectParams } from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class LayersRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<LayerRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url, { params }).pipe(
      map(response => ({
        items: (response.result?.items ?? []).map(l => this.#mapToDomain(l)),
        totalCount: response.result?.totalCount ?? 0,
        pageNumber: response.result?.pageNumber ?? 1,
        pageSize: response.result?.pageSize ?? 50,
        totalPages: response.result?.totalPages ?? 1,
      }))
    );
  }

  fetchActivePage(pageNumber = 1): Observable<LayerRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(l => this.#mapToDomain(l)))
    );
  }

  create(dto: CreateLayerDto): Observable<LayerRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Create)}`;
    const payload = {
      layerdto: {
        name: dto.name,
        address: '',
        locationId: Number(dto.locationId),
        unitId: Number(dto.greenhouseId),
        zoneId: Number(dto.zoneId),
        plantSystemId: Number(dto.systemId),
      },
      currentUserId: 'system',
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        systemId: dto.systemId,
        systemName: dto.systemName ?? '',
        zoneId: dto.zoneId,
        greenhouseId: dto.greenhouseId,
        locationId: dto.locationId,
        position: dto.position,
        totalCapacity: dto.totalCapacity,
        occupiedCapacity: 0,
        status: 'active' as const,
        pipesCount: 0,
      }))
    );
  }

  update(id: string, dto: UpdateLayerDto): Observable<PutPatch<LayerRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Update)}`;
    const payload = {
      name: dto.name,
      address: '',
      active: dto.status === 'active',
      systemId: Number(dto.systemId),
      locationId: Number(dto.locationId),
      unitId: Number(dto.greenhouseId),
      zoneId: Number(dto.zoneId),
    };
    return this.#http.put<unknown>(url, payload, { params: { id: String(Number(id)) } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        systemId: dto.systemId || '',
        systemName: dto.systemName ?? '',
        zoneId: dto.zoneId || '',
        greenhouseId: dto.greenhouseId || '',
        locationId: dto.locationId || '',
        position: dto.position ?? 1,
        totalCapacity: dto.totalCapacity ?? 0,
        status: dto.status || ('active' as const),
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

  #mapToDomain(l: ApiLayerItem): LayerRow {
    return {
      id: String(l.id),
      name: l.name ?? '',
      systemId: l.systemId != null ? String(l.systemId) : '',
      systemName: l.systemName ?? '',
      zoneId: l.zoneId != null ? String(l.zoneId) : '',
      greenhouseId: l.unitId != null ? String(l.unitId) : '',
      locationId: l.locationId != null ? String(l.locationId) : '',
      position: 1,
      totalCapacity: l.capacity ?? 0,
      occupiedCapacity: l.used ?? 0,
      status: l.active ? ('active' as const) : ('inactive' as const),
      pipesCount: 0,
    };
  }
}









