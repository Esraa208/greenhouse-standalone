import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subject } from 'rxjs';
import {
  applyListFilterPatch,
  bindListReloadStream,
  applyListPaginationFromResult,
  changeListPageSize,
} from '../../infrastructure/entity-list-facade.helpers';
import { DEFAULT_PAGE_SIZE } from '../../infrastructure/list-query';
import type { ApiDistributionFetchParams } from '@app/core/models/api-types';
import { GhToastService, TranslationService } from '@app/core';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { LossesRepository } from '../repositories/losses.repository';
import { BatchHistoryRepository } from '../repositories/batch-history.repository';
import { StockActionType } from '../models/stock-action-type';
import type { HousingHistorySummary, StockHistoryEntry } from '../models/batch-history.model';
import {
  AllocationRow,
  AllocationFilters,
  DEFAULT_ALLOCATION_FILTERS,
  MoveAllocationDto,
  RecordAllocationLossDto,
  type LossRecord,
  mapAllocationSetOrder,
  mapAllocationStatusParam,
} from '../models/allocation.model';

@Injectable({ providedIn: 'root' })
export class AllocationsFacade {
  readonly #repo = inject(AllocationsRepository);
  readonly #lossesRepo = inject(LossesRepository);
  readonly #batchHistoryRepo = inject(BatchHistoryRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #items = signal<AllocationRow[]>([]);
  readonly #filters = signal(DEFAULT_ALLOCATION_FILTERS);
  readonly #viewingHistoryItem = signal<AllocationRow | null>(null);
  readonly #viewingLossItem = signal<AllocationRow | null>(null);
  readonly #movingItem = signal<AllocationRow | null>(null);
  readonly #lossingItem = signal<AllocationRow | null>(null);
  readonly #isHistoryModalOpen = signal(false);
  readonly #isLossHistModalOpen = signal(false);
  readonly #isMoveModalOpen = signal(false);
  readonly #isLossModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly #pageNumber = signal(1);
  readonly #historyEntries = signal<StockHistoryEntry[]>([]);
  readonly #lossHistoryEntries = signal<LossRecord[]>([]);
  readonly #historyLoading = signal(false);
  readonly #housingHistorySummary = signal<HousingHistorySummary | null>(null);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly #moveTargetLocationId = signal('');
  readonly #moveTargetGhId = signal('');
  readonly #moveTargetZoneId = signal('');
  readonly #moveTargetSystemId = signal('');
  readonly #moveTargetLayerId = signal('');
  readonly #moveQuantity = signal(0);

  readonly filters = this.#filters.asReadonly();
  readonly viewingHistoryItem = this.#viewingHistoryItem.asReadonly();
  readonly viewingLossItem = this.#viewingLossItem.asReadonly();
  readonly movingItem = this.#movingItem.asReadonly();
  readonly lossingItem = this.#lossingItem.asReadonly();
  readonly isHistoryModalOpen = this.#isHistoryModalOpen.asReadonly();
  readonly isLossHistModalOpen = this.#isLossHistModalOpen.asReadonly();
  readonly isMoveModalOpen = this.#isMoveModalOpen.asReadonly();
  readonly isLossModalOpen = this.#isLossModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();
  readonly historyEntries = this.#historyEntries.asReadonly();
  readonly lossHistoryEntries = this.#lossHistoryEntries.asReadonly();
  readonly historyLoading = this.#historyLoading.asReadonly();
  readonly housingHistorySummary = this.#housingHistorySummary.asReadonly();

  readonly moveTargetLocationId = this.#moveTargetLocationId.asReadonly();
  readonly moveTargetGhId = this.#moveTargetGhId.asReadonly();
  readonly moveTargetZoneId = this.#moveTargetZoneId.asReadonly();
  readonly moveTargetSystemId = this.#moveTargetSystemId.asReadonly();
  readonly moveTargetLayerId = this.#moveTargetLayerId.asReadonly();
  readonly moveQuantity = this.#moveQuantity.asReadonly();

  constructor() {
    bindListReloadStream({
      destroyRef: this.#destroyRef,
      reloadNow$: this.#reloadNow$,
      reloadSearch$: this.#reloadSearch$,
      load: () => {
        const f = this.#filters();
        return this.#repo.getAll(this.#pageNumber(), f.searchQuery, this.#apiFilters(f), this.#pageSize());
      },
      setItems: (items) => this.#items.set(items),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      setPagination: (p) => applyListPaginationFromResult(p, this.#totalCount, this.#totalPages),
    });
  }

  readonly filteredItems = computed<AllocationRow[]>(() => this.#items());

  readonly movingItemMaxQty = computed(() => this.#movingItem()?.quantity ?? 0);

  readonly canConfirmMove = computed(() => {
    const qty = this.#moveQuantity();
    const max = this.movingItemMaxQty();
    return !!this.#moveTargetLayerId() && qty > 0 && qty <= max;
  });

  #apiFilters(f: AllocationFilters): Partial<ApiDistributionFetchParams> {
    const params: Record<string, number | string> = {};
    if (f.locationId !== 'all') params['LocationId'] = Number(f.locationId);
    if (f.greenhouseId !== 'all') params['UnitId'] = Number(f.greenhouseId);
    if (f.zoneId !== 'all') params['ZoneId'] = Number(f.zoneId);
    if (f.systemId !== 'all') params['SystemId'] = Number(f.systemId);
    if (f.layerId !== 'all') params['LayerId'] = Number(f.layerId);
    if (f.stockBatchId) params['StockBatchId'] = Number(f.stockBatchId);
    const status = mapAllocationStatusParam(f.status);
    if (status) params['Status'] = status;
    const setOrder = mapAllocationSetOrder(f.sortBy);
    if (setOrder) params['SetOrder'] = setOrder;
    return params as Partial<ApiDistributionFetchParams>;
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  enterPage(): void {
    this.#filters.set(DEFAULT_ALLOCATION_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  confirmMove(): void {
    const item = this.#movingItem();
    if (!item || !this.canConfirmMove()) return;
    const dto: MoveAllocationDto = {
      allocationId: item.id,
      batchId: item.batchId,
      targetLayerId: this.#moveTargetLayerId(),
      quantity: this.#moveQuantity(),
    };
    this.#repo
      .move(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.closeMoveModal();
          this.#reloadNow$.next();
          this.#toast.success(this.#i18n.t('allocations.move_success'));
        },
      });
  }

  confirmRecordLoss(dto: RecordAllocationLossDto): void {
    if (!this.#lossingItem()) return;

    this.#lossesRepo
      .createAllocationLoss(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.closeLossModal();
          this.#reloadNow$.next();
          this.#toast.success(this.#i18n.t('losses.toast_create_success'));
        },
      });
  }

  patchFilters(patch: Partial<AllocationFilters>): void {
    applyListFilterPatch(
      patch,
      this.#filters,
      this.#pageNumber,
      this.#reloadNow$,
      this.#reloadSearch$,
    );
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_ALLOCATION_FILTERS);
    this.#reloadNow$.next();
  }

  openHistoryModal(item: AllocationRow): void {
    this.#viewingHistoryItem.set(item);
    this.#isHistoryModalOpen.set(true);
    this.#loadHousingHistory(item.id);
  }

  closeHistoryModal(): void {
    this.#isHistoryModalOpen.set(false);
    this.#viewingHistoryItem.set(null);
    this.#historyEntries.set([]);
    this.#housingHistorySummary.set(null);
    this.#historyLoading.set(false);
  }

  openLossHistoryModal(item: AllocationRow): void {
    this.#viewingLossItem.set(item);
    this.#isLossHistModalOpen.set(true);
    this.#loadHousingLossHistory(item.id);
  }

  closeLossHistoryModal(): void {
    this.#isLossHistModalOpen.set(false);
    this.#viewingLossItem.set(null);
    this.#lossHistoryEntries.set([]);
    this.#historyLoading.set(false);
  }

  openMoveModal(item: AllocationRow): void {
    this.#movingItem.set(item);
    this.#moveQuantity.set(item.quantity);
    this.#isMoveModalOpen.set(true);
    this.#resetMoveCascade();
  }

  closeMoveModal(): void {
    this.#isMoveModalOpen.set(false);
    this.#movingItem.set(null);
  }

  openLossModal(item: AllocationRow): void {
    this.#lossingItem.set(item);
    this.#isLossModalOpen.set(true);
  }

  closeLossModal(): void {
    this.#isLossModalOpen.set(false);
    this.#lossingItem.set(null);
  }

  setMoveLocationId(id: string): void {
    this.#moveTargetLocationId.set(id);
    this.#moveTargetGhId.set('');
    this.#moveTargetZoneId.set('');
    this.#moveTargetSystemId.set('');
    this.#moveTargetLayerId.set('');
  }

  setMoveGhId(id: string): void {
    this.#moveTargetGhId.set(id);
    this.#moveTargetZoneId.set('');
    this.#moveTargetSystemId.set('');
    this.#moveTargetLayerId.set('');
  }

  setMoveZoneId(id: string): void {
    this.#moveTargetZoneId.set(id);
    this.#moveTargetSystemId.set('');
    this.#moveTargetLayerId.set('');
  }

  setMoveSystemId(id: string): void {
    this.#moveTargetSystemId.set(id);
    this.#moveTargetLayerId.set('');
  }

  setMoveLayerId(id: string): void {
    this.#moveTargetLayerId.set(id);
  }

  setMoveQuantity(qty: number): void {
    this.#moveQuantity.set(qty);
  }

  setMoveQuantityPct(fraction: number): void {
    const max = this.movingItemMaxQty();
    const qty =
      fraction >= 1 ? max : Math.max(1, Math.floor(max * fraction));
    this.#moveQuantity.set(qty);
  }

  #loadHousingHistory(housingId: string): void {
    this.#historyLoading.set(true);
    this.#historyEntries.set([]);
    this.#housingHistorySummary.set(null);
    this.#batchHistoryRepo
      .getHousingHistory(housingId)
      .pipe(
        finalize(() => this.#historyLoading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.#housingHistorySummary.set(result.summary);
          this.#historyEntries.set(
            result.entries.filter((e) => e.actionType !== StockActionType.Loss),
          );
        },
        error: () => {
          this.#historyEntries.set([]);
          this.#housingHistorySummary.set(null);
        },
      });
  }

  #loadHousingLossHistory(housingId: string): void {
    this.#historyLoading.set(true);
    this.#lossHistoryEntries.set([]);
    this.#lossesRepo
      .getByHousingId(housingId)
      .pipe(
        finalize(() => this.#historyLoading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (entries) => this.#lossHistoryEntries.set(entries),
        error: () => this.#lossHistoryEntries.set([]),
      });
  }

  #resetMoveCascade(): void {
    this.#moveTargetLocationId.set('');
    this.#moveTargetGhId.set('');
    this.#moveTargetZoneId.set('');
    this.#moveTargetSystemId.set('');
    this.#moveTargetLayerId.set('');
  }
}
