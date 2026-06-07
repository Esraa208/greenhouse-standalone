import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
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
import type { CreateBatchLossDto } from '../models/loss-registration.model';
import type { RecordAllocationLossDto, LossRecord } from '../models/allocation.model';
import { AllocationsRepository } from './allocations.repository';
import type { AllocationRow } from '../models/allocation.model';
import { API_BASE_URL, PaginatedResult, PagedListQuery, buildPagedListParams } from '@app/core/data-access/infrastructure';
import { apiRefId } from '@app/core/data-access/infrastructure/api-entity-ref';
import { buildLocationSelectParams, normalizePaginatedResult } from '../../infrastructure/list-query';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';
import {
  ApiController, ApiAction, getEndpoint,
  ApiPaginatedResult, ApiLossItem, ApiBatchItem, ApiDistributionItem,
  ApiLocationItem, ApiUnitItem, ApiZoneItem, ApiSystemItem, ApiLayerItem,
  ApiCreateLossCommand,
  ApiLossPreviewParams,
  ApiLossPreviewResult,
} from '@app/core/data-access/api';
import {
  toAllocationLossCommand,
  toBatchLossCommand,
  toCreationDateIso,
  toLossPageCommand,
} from './losses-create.mapper';
import { mapApiLossToRecord, mapApiLossToRow } from './losses-fetch.mapper';
import { mapApiLossPreviewResult } from './loss-preview.mapper';
import type { LossScopePreview } from '../models/loss-preview.model';

/** Shape returned by POST /api/Losses/Create */
interface ApiLossCreateResponse {
  readonly id?: number;
}

@Injectable({ providedIn: 'root' })
export class LossesRepository {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = inject(API_BASE_URL);
  readonly #allocationsRepo = inject(AllocationsRepository);

  getAll(query: PagedListQuery = { pageNumber: 1 }): Observable<PaginatedResult<LossRow>> {
    const params = buildPagedListParams(query);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLossItem>>(url, { params }).pipe(
      map(response => {
        const items = (response.result?.items ?? []).map(apiLoss => mapApiLossToRow(apiLoss));
        return normalizePaginatedResult(response.result, items, query.pageSize);
      })
    );
  }

  /** Loss records for one housing (تسكين) — GET /api/Losses/fetch?HousingId=… */
  getByHousingId(housingId: string): Observable<LossRecord[]> {
    const id = housingId?.trim();
    if (!id) return of([]);

    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Fetch)}`;
    return this.#http
      .get<ApiPaginatedResult<ApiLossItem>>(url, {
        params: { PageNumber: 1, HousingId: Number(id) },
      })
      .pipe(
        map((response) =>
          (response.result?.items ?? [])
            .map((item) => mapApiLossToRecord(item))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        ),
      );
  }

  getById(id: string): Observable<LossRow> {
    return this.getAll().pipe(
      map(result => {
        const found = result.items.find(i => i.id === id);
        if (!found) throw new Error(`Loss record with id ${id} not found`);
        return found;
      })
    );
  }

  getAllocationsByBatch(batchId: string): Observable<AllocationRow[]> {
    return this.#allocationsRepo
      .getAll(1, '', { StockBatchId: Number(batchId) })
      .pipe(map((result) => result.items.filter((row) => row.status === 'active')));
  }

  /** GET /api/Losses/preview — scope stats before recording */
  previewScope(params: ApiLossPreviewParams): Observable<LossScopePreview> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Preview)}`;
    const query: Record<string, string | number> = {};
    if (params.StockBatchId != null) query['StockBatchId'] = params.StockBatchId;
    if (params.LocationId != null) query['LocationId'] = params.LocationId;
    if (params.UnitId != null) query['UnitId'] = params.UnitId;
    if (params.ZoneId != null) query['ZoneId'] = params.ZoneId;
    if (params.SystemId != null) query['SystemId'] = params.SystemId;
    if (params.LayerId != null) query['LayerId'] = params.LayerId;
    if (params.HousingId != null) query['HousingId'] = params.HousingId;

    return this.#http
      .get<{ result: ApiLossPreviewResult }>(url, { params: query })
      .pipe(map((response) => mapApiLossPreviewResult(response.result)));
  }

  createBatchLoss(dto: CreateBatchLossDto): Observable<void> {
    return this.createLoss(toBatchLossCommand(dto));
  }

  createAllocationLoss(dto: RecordAllocationLossDto): Observable<void> {
    return this.createLoss(toAllocationLossCommand(dto));
  }

  createLoss(payload: ApiCreateLossCommand): Observable<void> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Losses, ApiAction.Create)}`;
    return this.#http.post<ApiLossCreateResponse>(url, payload).pipe(map(() => undefined));
  }

  create(dto: CreateLossDto): Observable<LossRow> {
    const payload = toLossPageCommand(dto);

    return this.createLoss(payload).pipe(
      map(() => ({
        id: String(Date.now()),
        date: toCreationDateIso(dto.date),
        sourceType: dto.mode === 'batch' ? 'batch' as const : 'allocation' as const,
        sourceTypeLabel: '',
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
    return this.#http.get<ApiPaginatedResult<ApiLocationItem>>(url, {
      params: buildLocationSelectParams(1),
    }).pipe(
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
        name: normalizeGreenhouseLabel(i.name),
        locationId: String(i.location?.id ?? i.locationId ?? ''),
      })))
    );
  }

  getRefZones(): Observable<LossRefZone[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Zone, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiZoneItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        greenhouseId: apiRefId(i.unit, i.unitId),
      })))
    );
  }

  getRefSystems(): Observable<LossRefSystem[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.System, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiSystemItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        zoneId: apiRefId(i.zone, i.zoneId),
      })))
    );
  }

  getRefLayers(): Observable<LossRefLayer[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Layer, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiLayerItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => ({
        id: String(i.id),
        name: i.name,
        systemId: apiRefId(i.system, i.systemId) || String(i.id),
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
        layerId: String(i.layerId ?? ''),
        quantity: i.quantity || 0,
      })))
    );
  }

  getRefBatches(): Observable<LossRefBatch[]> {
    const url = `${this.#apiUrl}/${getEndpoint(ApiController.Batch, ApiAction.Fetch)}`;
    return this.#http.get<ApiPaginatedResult<ApiBatchItem>>(url).pipe(
      map(response => (response.result?.items ?? []).map(i => {
        const quantity = i.quantities?.current ?? i.quantity ?? i.totalQuantity ?? 0;
        return {
          id: String(i.id),
          batchNumber: i.batchNumber?.trim() || `BTH-${String(i.id).padStart(3, '0')}`,
          cropType: i.crop?.name?.trim() ?? i.cropTypeName?.trim() ?? '',
          totalQuantity: quantity,
          allocationsCount: 0,
        };
      }))
    );
  }

}










