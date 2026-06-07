import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LayerRow, CreateLayerDto, UpdateLayerDto } from '../models/layer.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiLayerItem,
} from '@app/core/data-access/api';
import {
  PagedListQuery,
  PaginatedResult,
  buildPagedListParams,
  buildLayerSelectParams,
  normalizePaginatedResult,
} from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import { apiRefId, apiRefName, mapApiEntityStatus, readApiOccupancy } from '../api-entity-ref';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class LayersRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<LayerRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(l => this.#mapToDomain(l));
        return normalizePaginatedResult(response.result, items, query.pageSize);
      })
    );
  }

  fetchActivePage(pageNumber = 1): Observable<LayerRow[]> {
    const params = buildLayerSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(l => this.#mapToDomain(l)))
    );
  }

  /** Active layers for one system — modal/filter cascades. */
  fetchActiveBySystem(systemId: string, pageNumber = 1): Observable<LayerRow[]> {
    const params = { ...buildLayerSelectParams(pageNumber), SystemId: Number(systemId) };
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(l => this.#mapToDomain(l)))
    );
  }

  create(dto: CreateLayerDto): Observable<LayerRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Create)}`;
    const payload = {
      currentUserId: 'system',
      layer: {
        name: dto.name,
        plantSystemId: Number(dto.systemId),
        capacity: dto.totalCapacity,
      },
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        systemId: dto.systemId,
        systemName: dto.systemName ?? '',
        zoneId: dto.zoneId ?? '',
        greenhouseId: dto.greenhouseId ?? '',
        locationId: dto.locationId ?? '',
        position: 1,
        totalCapacity: dto.totalCapacity,
        occupiedCapacity: 0,
        availableCapacity: dto.totalCapacity,
        status: 'active' as const,
        pipesCount: 0,
      }))
    );
  }

  update(id: string, dto: UpdateLayerDto): Observable<PutPatch<LayerRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Update)}`;
    const payload = {
      name: dto.name,
      active: dto.status === 'active',
      plantSystemId: Number(dto.systemId),
      capacity: dto.totalCapacity,
    };
    return this.#http.put<unknown>(url, payload, { params: { id: String(Number(id)) } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        systemId: dto.systemId || '',
        systemName: dto.systemName ?? '',
        zoneId: dto.zoneId ?? '',
        greenhouseId: dto.greenhouseId ?? '',
        locationId: dto.locationId ?? '',
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
    const occ = readApiOccupancy(l.occupancy, {
      totalCapacity: l.capacity,
      used: l.used,
      percent: l.occupancyPercent,
    });
    const available =
      l.available ??
      Math.max(0, occ.totalCapacity - occ.used);
    return {
      id: String(l.id),
      name: l.name ?? '',
      systemId: apiRefId(l.system, l.systemId),
      systemName: apiRefName(l.system, l.systemName),
      zoneId: apiRefId(l.zone, l.zoneId),
      greenhouseId: apiRefId(l.unit, l.unitId),
      locationId: apiRefId(l.location, l.locationId),
      position: 1,
      totalCapacity: occ.totalCapacity,
      occupiedCapacity: occ.used,
      availableCapacity: available,
      status: mapApiEntityStatus(l.status, l.active),
      pipesCount: 0,
    };
  }
}









