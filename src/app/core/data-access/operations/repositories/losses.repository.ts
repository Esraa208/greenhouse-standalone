import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  LossRow,
  CreateLossDto,
  LossRefLocation,
  LossRefGreenhouse,
  LossRefZone,
  LossRefSystem,
  LossRefLayer,
  LossRefAllocation,
  LossRefBatch,
  LossType as LossTypeStr,
} from '../models/loss.model';
import { API_BASE_URL } from '@app/core/data-access/infrastructure';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiLossItem, ApiBatchItem, ApiDistributionItem,
  ApiLocationItem, ApiUnitItem, ApiZoneItem, ApiSystemItem, ApiLayerItem,
  ApiCreateLossCommand,
} from '@app/core/data-access/api';

/** Shape returned by POST /api/Losses/Create */
interface ApiLossCreateResponse {
  readonly id?: number;
}

@Injectable({ providedIn: 'root' })
export class LossesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);

  getAll(pageNumber = 1, search = ''): Observable<LossRow[]> {
    const params: Record<string, string | number | boolean> = { PageNumber: pageNumber };
    if (search) params['Search'] = search;

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLossItem>>(url, { params }).pipe(
      map(response => {
        const items = response.result?.items ?? [];
        return items.map(apiLoss => this.#mapToDomain(apiLoss));
      })
    );
  }

  getById(id: string): Observable<LossRow> {
    return this.getAll().pipe(
      map(items => {
        const found = items.find(i => i.id === id);
        if (!found) throw new Error(`Loss record with id ${id} not found`);
        return found;
      })
    );
  }

  create(dto: CreateLossDto): Observable<LossRow> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Create)}`;
    const payload: ApiCreateLossCommand = {
      batchId: Number(dto.batchId ?? 0),
      lossType: this.#mapLossTypeToApi(dto.lossType),
      reason: dto.reason,
      currentUserId: 'system',
      items: dto.allocationId ? [{
        distributionId: Number(dto.allocationId),
        quantity: dto.quantity ?? 0,
      }] : [],
    };

    return this.#http.post<ApiLossCreateResponse>(url, payload).pipe(
      map(apiLoss => ({
        id: String(apiLoss?.id ?? Date.now()),
        date: dto.date,
        sourceType: dto.mode === 'batch' ? 'batch' as const : 'allocation' as const,
        sourceName: '',
        sourcePath: '',
        location: '',
        greenhouse: '',
        lossType: dto.lossType,
        quantity: dto.quantity ?? 0,
        reason: dto.reason,
        notes: dto.notes,
      }))
    );
  }

  update(id: string, _dto: CreateLossDto): Observable<LossRow> {
    return this.getById(id);
  }

  delete(id: string): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Fetch)}`;
    return this.#http.delete<void>(url, { params: { Id: id } });
  }

  // ─── Reference Data ────────────────────────────────────────

  getRefLocations(): Observable<LossRefLocation[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Locations, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLocationItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
      })))
    );
  }

  getRefGreenhouses(): Observable<LossRefGreenhouse[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Units, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiUnitItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        locationId: String(i.locationId),
      })))
    );
  }

  getRefZones(): Observable<LossRefZone[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        greenhouseId: String(i.unitId),
      })))
    );
  }

  getRefSystems(): Observable<LossRefSystem[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        zoneId: String(i.zoneId),
      })))
    );
  }

  getRefLayers(): Observable<LossRefLayer[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        systemId: String(i.systemId ?? i.id),
        totalQuantity: 0,
      })))
    );
  }

  getRefAllocations(): Observable<LossRefAllocation[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.BatchDistribution, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiDistributionItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        pipeName: i.pipeName || '',
        batchNumber: i.stockBatchNumber || '',
        cropType: '',
        layerId: '',
        quantity: i.quantity || 0,
      })))
    );
  }

  getRefBatches(): Observable<LossRefBatch[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiBatchItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        batchNumber: `BTH-${String(i.id).padStart(3, '0')}`,
        cropType: i.cropTypeName || '',
        totalQuantity: i.quantity || 0,
        allocationsCount: 0,
      })))
    );
  }

  // ─── Private helpers ───────────────────────────────────────

  #mapToDomain(apiLoss: ApiLossItem): LossRow {
    return {
      id: String(apiLoss.id),
      date: apiLoss.creationDate || new Date().toISOString(),
      sourceType: apiLoss.distributionId ? 'allocation' : 'batch',
      sourceName: apiLoss.batchNumber || '',
      sourcePath: apiLoss.pipeName || '',
      location: '',
      greenhouse: '',
      lossType: this.#mapLossTypeFromApi(apiLoss.lossType),
      quantity: apiLoss.quantity || 0,
      reason: apiLoss.reason || '',
    };
  }

  #mapLossTypeToApi(type: LossTypeStr): number {
    switch (type) {
      case 'disease': return 1;
      case 'pest': return 2;
      case 'weather': return 3;
      case 'other': return 4;
      default: return 4;
    }
  }

  #mapLossTypeFromApi(type: number): LossTypeStr {
    switch (type) {
      case 1: return 'disease';
      case 2: return 'pest';
      case 3: return 'weather';
      default: return 'other';
    }
  }
}










