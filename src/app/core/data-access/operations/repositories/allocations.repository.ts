import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AllocationRow, MoveAllocationDto, RecordAllocationLossDto, LossTypeRef } from '../models/allocation.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import { normalizeAppError } from '@app/core/errors/app-error';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiDistributionItem, ApiPipeItem,
  ApiLocationItem, ApiUnitItem, ApiZoneItem, ApiSystemItem, ApiLayerItem,
  ApiMoveBatchDto, ApiCreateLossCommand, ApiDistributionFetchParams,
} from '@app/core/data-access/api';

/** Typed ref-data item returned by getRef* methods */
interface RefItem {
  readonly id: string;
  readonly name: string;
}

interface RefItemWithParent extends RefItem {
  readonly parentId: string;
}

@Injectable({ providedIn: 'root' })
export class AllocationsRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(pageNumber = 1, search = '', filters?: Partial<ApiDistributionFetchParams>): Observable<AllocationRow[]> {
    const params: Record<string, string | number | boolean> = { PageNumber: pageNumber };
    if (search) params['Search'] = search;
    if (filters?.LocationId) params['LocationId'] = filters.LocationId;
    if (filters?.UnitId) params['UnitId'] = filters.UnitId;
    if (filters?.ZoneId) params['ZoneId'] = filters.ZoneId;
    if (filters?.SystemId) params['SystemId'] = filters.SystemId;
    if (filters?.PipeId) params['PipeId'] = filters.PipeId;
    if (filters?.StockBatchId) params['StockBatchId'] = filters.StockBatchId;

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.BatchDistribution, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiDistributionItem>>(url, { params }).pipe(
      map(response => {
        const items = response.result?.items ?? [];
        return items.map(dist => this.#mapToDomain(dist));
      }),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getById(id: string): Observable<AllocationRow> {
    return this.getAll().pipe(
      map(items => {
        const found = items.find(i => i.id === id);
        if (!found) throw new Error(`Allocation with id ${id} not found`);
        return found;
      })
    );
  }

  move(dto: MoveAllocationDto): Observable<AllocationRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Move)}`;
    const payload: ApiMoveBatchDto = {
      distributionId: Number(dto.allocationId),
      toPipeId: Number(dto.targetPipeId),
      fromPipeId: 0, // API may derive this from distributionId
      quantity: dto.quantity,
    };
    return this.#http.put<unknown>(url, payload).pipe(
      map(() => ({ id: dto.allocationId } as AllocationRow)),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  recordLoss(dto: RecordAllocationLossDto): Observable<AllocationRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Create)}`;
    const payload: ApiCreateLossCommand = {
      batchId: 0,
      lossType: this.#mapLossType(dto.lossType),
      reason: dto.reason,
      currentUserId: 'system',
      items: [{
        distributionId: Number(dto.allocationId),
        quantity: dto.quantity,
      }],
    };
    return this.#http.post<unknown>(url, payload).pipe(
      map(() => ({ id: dto.allocationId } as AllocationRow)),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.BatchDistribution, ApiAction.Delete)}`;
    return this.#http.delete<void>(url, { params: { Id: id } }).pipe(
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  // ─── Reference Data for Cascade Dropdowns ──────────────────

  getRefLocations(): Observable<RefItem[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLocationItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
      }))),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getRefGreenhouses(): Observable<(RefItem & { locationId: string })[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        locationId: String(i.locationId),
      }))),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getRefZones(): Observable<(RefItem & { greenhouseId: string })[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        greenhouseId: String(i.unitId),
      }))),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getRefSystems(): Observable<(RefItem & { zoneId: string })[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        zoneId: String(i.zoneId),
      }))),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getRefLayers(): Observable<(RefItem & { systemId: string })[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        systemId: String(i.systemId ?? i.id),
      }))),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  getRefPipes(): Observable<(RefItem & { layerId: string })[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Pipe, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiPipeItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        layerId: String(i.layerId),
      }))),
      catchError((err: unknown) => throwError(() => normalizeAppError(err)))
    );
  }

  // ─── Private helpers ───────────────────────────────────────

  #mapToDomain(dist: ApiDistributionItem): AllocationRow {
    return {
      id: String(dist.id),
      batchNumber: dist.stockBatchNumber || `BTH-${dist.stockBatchId}`,
      batchId: String(dist.stockBatchId),
      cropType: '',
      location: '',
      greenhouse: '',
      zone: '',
      system: '',
      layer: '',
      layerPosition: 1,
      pipe: dist.pipeName || '',
      quantity: dist.quantity,
      initialQuantity: dist.quantity,
      allocatedDate: new Date().toISOString(),
      status: 'active',
      movementHistory: [],
      lossHistory: [],
    };
  }

  #mapLossType(type: LossTypeRef): number {
    switch (type) {
      case 'disease': return 1;
      case 'pest': return 2;
      case 'weather': return 3;
      case 'other': return 4;
      default: return 4;
    }
  }
}










