import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PipeRow, CreatePipeDto, UpdatePipeDto } from '../models/pipe.model';
import { API_BASE_URL } from '../tokens';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiPipeItem,
} from '@app/core/data-access/api';
import { PagedListQuery, PaginatedResult, buildPagedListParams, buildActiveSelectParams } from '../list-query';
import { extractCreatedId } from '../extract-created-id';
import type { PutPatch } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class PipesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<PipeRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Pipe, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiPipeItem>>(url, { params }).pipe(
      map(response => ({
        items: (response.result?.items ?? []).map(p => this.#mapToDomain(p)),
        totalCount: response.result?.totalCount ?? 0,
        pageNumber: response.result?.pageNumber ?? 1,
        pageSize: response.result?.pageSize ?? 50,
        totalPages: response.result?.totalPages ?? 1,
      }))
    );
  }

  fetchActivePage(pageNumber = 1): Observable<PipeRow[]> {
    const params = buildActiveSelectParams(pageNumber);
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Pipe, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiPipeItem>>(url, { params }).pipe(
      map(response => (response.result?.items ?? []).map(p => this.#mapToDomain(p)))
    );
  }

  create(dto: CreatePipeDto): Observable<PipeRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Pipe, ApiAction.Create)}`;
    const payload = {
      pipedto: {
        name: dto.name,
        address: '',
        capacity: dto.capacity,
        locationId: Number(dto.locationId),
        unitId: Number(dto.greenhouseId),
        zoneId: Number(dto.zoneId),
        systemId: Number(dto.systemId),
        layerId: Number(dto.layerId),
        active: dto.status === 'active',
      },
      currentUserId: 'system',
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(res => ({
        id: extractCreatedId(res),
        name: dto.name,
        layerId: dto.layerId,
        layerName: dto.layerName ?? '',
        systemId: dto.systemId,
        zoneId: dto.zoneId,
        greenhouseId: dto.greenhouseId,
        locationId: dto.locationId,
        capacity: dto.capacity,
        occupiedCapacity: 0,
        status: 'active' as const,
      }))
    );
  }

  update(id: string, dto: UpdatePipeDto): Observable<PutPatch<PipeRow>> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Pipe, ApiAction.Update)}`;
    const payload = {
      name: dto.name,
      address: '',
      active: dto.status === 'active',
      layerId: Number(dto.layerId),
      capacity: dto.capacity ?? 0,
      locationId: Number(dto.locationId),
      unitId: Number(dto.greenhouseId),
      zoneId: Number(dto.zoneId),
      systemId: Number(dto.systemId),
    };
    return this.#http.put<unknown>(url, payload, { params: { id } }).pipe(
      map(() => ({
        id,
        name: dto.name || '',
        layerId: dto.layerId || '',
        layerName: dto.layerName ?? '',
        systemId: dto.systemId || '',
        zoneId: dto.zoneId || '',
        greenhouseId: dto.greenhouseId || '',
        locationId: dto.locationId || '',
        capacity: dto.capacity ?? 0,
        status: dto.status || ('active' as const),
      }))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Pipe, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

  #mapToDomain(p: ApiPipeItem): PipeRow {
    return {
      id: String(p.id),
      name: p.name ?? '',
      layerId: String(p.layerId),
      layerName: p.layerName ?? '',
      systemId: p.systemId != null ? String(p.systemId) : '',
      zoneId: p.zoneId != null ? String(p.zoneId) : '',
      greenhouseId: p.unitId != null ? String(p.unitId) : '',
      locationId: p.locationId != null ? String(p.locationId) : '',
      capacity: p.pipesCapacity ?? 0,
      occupiedCapacity: p.used ?? 0,
      status: p.active ? ('active' as const) : ('inactive' as const),
    };
  }
}









