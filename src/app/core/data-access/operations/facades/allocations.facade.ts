import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subject } from 'rxjs';
import {
  applyListFilterPatch,
  bindListReloadStream,
} from '../../infrastructure/entity-list-facade.helpers';
import type { ApiDistributionFetchParams } from '@app/core/models/api-types';
import { GhToastService, TranslationService } from '@app/core';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { BatchHistoryRepository } from '../repositories/batch-history.repository';
import { StockActionType } from '../models/stock-action-type';
import type { StockHistoryEntry } from '../models/batch-history.model';
import {
  AllocationRow,
  AllocationFilters,
  DEFAULT_ALLOCATION_FILTERS,
  MoveAllocationDto,
  RecordAllocationLossDto,
} from '../models/allocation.model';

@Injectable({ providedIn: 'root' })
export class AllocationsFacade {
  readonly #repo = inject(AllocationsRepository);
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
  readonly #pageSize = signal(50);
  readonly #pageNumber = signal(1);
  readonly #historyEntries = signal<StockHistoryEntry[]>([]);
  readonly #historyLoading = signal(false);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly #moveTargetLocationId = signal('');
  readonly #moveTargetGhId = signal('');
  readonly #moveTargetZoneId = signal('');
  readonly #moveTargetSystemId = signal('');
  readonly #moveTargetLayerId = signal('');
  readonly #moveQuantity = signal(0);

  readonly #refLocations = signal<{ id: string; name: string }[]>([]);
  readonly #refGreenhouses = signal<{ id: string; name: string; locationId: string }[]>([]);
  readonly #refZones = signal<{ id: string; name: string; greenhouseId: string }[]>([]);
  readonly #refSystems = signal<{ id: string; name: string; zoneId: string }[]>([]);
  readonly #refLayers = signal<{ id: string; name: string; systemId: string }[]>([]);
  readonly #refPipes = signal<{ id: string; name: string; layerId: string }[]>([]);

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
  readonly historyLoading = this.#historyLoading.asReadonly();

  readonly moveTargetLocationId = this.#moveTargetLocationId.asReadonly();
  readonly moveTargetGhId = this.#moveTargetGhId.asReadonly();
  readonly moveTargetZoneId = this.#moveTargetZoneId.asReadonly();
  readonly moveTargetSystemId = this.#moveTargetSystemId.asReadonly();
  readonly moveTargetLayerId = this.#moveTargetLayerId.asReadonly();
  readonly moveQuantity = this.#moveQuantity.asReadonly();
  readonly refLocations = this.#refLocations.asReadonly();

  constructor() {
    bindListReloadStream({
      destroyRef: this.#destroyRef,
      reloadNow$: this.#reloadNow$,
      reloadSearch$: this.#reloadSearch$,
      load: () => {
        const f = this.#filters();
        return this.#repo.getAll(this.#pageNumber(), f.searchQuery, this.#apiFilters(f));
      },
      setItems: (items) => this.#items.set(items),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      setPagination: (p) => {
        this.#totalCount.set(p.totalCount);
        this.#totalPages.set(p.totalPages);
        this.#pageSize.set(p.pageSize);
      },
    });
  }

  /** Client-side status, batch, layer (via pipe), and sort on server-filtered rows */
  readonly filteredItems = computed<AllocationRow[]>(() => {
    const { status, batchNumber, layerId, pipeId, sortBy } = this.#filters();
    let result = this.#items();

    if (status !== 'all') {
      result = result.filter((a) => a.status === status);
    }
    if (batchNumber) {
      result = result.filter((a) => a.batchNumber === batchNumber);
    }
    if (layerId !== 'all' && pipeId === 'all') {
      const pipeIds = new Set(
        this.#refPipes()
          .filter((p) => p.layerId === layerId)
          .map((p) => p.id),
      );
      result = result.filter((a) => pipeIds.has(a.pipeId));
    }
    if (pipeId !== 'all') {
      result = result.filter((a) => a.pipeId === pipeId);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.allocatedDate).getTime() - new Date(a.allocatedDate).getTime();
        case 'date-asc':
          return new Date(a.allocatedDate).getTime() - new Date(b.allocatedDate).getTime();
        case 'quantity-desc':
          return b.quantity - a.quantity;
        case 'quantity-asc':
          return a.quantity - b.quantity;
        case 'batch-asc':
          return a.batchNumber.localeCompare(b.batchNumber);
        case 'batch-desc':
          return b.batchNumber.localeCompare(a.batchNumber);
        default:
          return 0;
      }
    });
  });

  readonly uniqueBatches = computed(() =>
    [...new Set(this.#items().map((a) => a.batchNumber))].sort(),
  );

  readonly filterLocations = computed(() => this.#refLocations());

  readonly filterGreenhouses = computed(() => {
    const { locationId } = this.#filters();
    const src = this.#refGreenhouses();
    return locationId === 'all' ? src : src.filter((gh) => gh.locationId === locationId);
  });

  readonly filterZones = computed(() => {
    const { locationId, greenhouseId } = this.#filters();
    const src = this.#refZones();
    if (greenhouseId !== 'all') return src.filter((z) => z.greenhouseId === greenhouseId);
    if (locationId === 'all') return src;
    const ghIds = new Set(
      this.#refGreenhouses()
        .filter((g) => g.locationId === locationId)
        .map((g) => g.id),
    );
    return src.filter((z) => ghIds.has(z.greenhouseId));
  });

  readonly filterSystems = computed(() => {
    const { locationId, greenhouseId, zoneId } = this.#filters();
    const src = this.#refSystems();
    if (zoneId !== 'all') return src.filter((s) => s.zoneId === zoneId);
    if (greenhouseId !== 'all') {
      const zoneIds = new Set(
        this.#refZones()
          .filter((z) => z.greenhouseId === greenhouseId)
          .map((z) => z.id),
      );
      return src.filter((s) => zoneIds.has(s.zoneId));
    }
    if (locationId === 'all') return src;
    const ghIds = new Set(
      this.#refGreenhouses()
        .filter((g) => g.locationId === locationId)
        .map((g) => g.id),
    );
    const zoneIds = new Set(
      this.#refZones()
        .filter((z) => ghIds.has(z.greenhouseId))
        .map((z) => z.id),
    );
    return src.filter((s) => zoneIds.has(s.zoneId));
  });

  readonly filterLayers = computed(() => {
    const f = this.#filters();
    const src = this.#refLayers();
    if (f.systemId !== 'all') return src.filter((l) => l.systemId === f.systemId);

    let systemIds: Set<string> | null = null;
    if (f.zoneId !== 'all') {
      systemIds = new Set(
        this.#refSystems()
          .filter((s) => s.zoneId === f.zoneId)
          .map((s) => s.id),
      );
    } else if (f.greenhouseId !== 'all') {
      const zoneIds = new Set(
        this.#refZones()
          .filter((z) => z.greenhouseId === f.greenhouseId)
          .map((z) => z.id),
      );
      systemIds = new Set(
        this.#refSystems()
          .filter((s) => zoneIds.has(s.zoneId))
          .map((s) => s.id),
      );
    } else if (f.locationId !== 'all') {
      const ghIds = new Set(
        this.#refGreenhouses()
          .filter((g) => g.locationId === f.locationId)
          .map((g) => g.id),
      );
      const zoneIds = new Set(
        this.#refZones()
          .filter((z) => ghIds.has(z.greenhouseId))
          .map((z) => z.id),
      );
      systemIds = new Set(
        this.#refSystems()
          .filter((s) => zoneIds.has(s.zoneId))
          .map((s) => s.id),
      );
    }
    if (!systemIds) return src;
    return src.filter((l) => systemIds!.has(l.systemId));
  });

  readonly filterPipes = computed(() => {
    const f = this.#filters();
    const src = this.#refPipes();
    if (f.layerId !== 'all') return src.filter((p) => p.layerId === f.layerId);
    const layerIds = new Set(this.filterLayers().map((l) => l.id));
    return src.filter((p) => layerIds.has(p.layerId));
  });

  readonly moveFilteredGhs = computed(() =>
    this.#refGreenhouses().filter(
      (gh) => !this.#moveTargetLocationId() || gh.locationId === this.#moveTargetLocationId(),
    ),
  );
  readonly moveFilteredZones = computed(() =>
    this.#refZones().filter(
      (z) => !this.#moveTargetGhId() || z.greenhouseId === this.#moveTargetGhId(),
    ),
  );
  readonly moveFilteredSystems = computed(() =>
    this.#refSystems().filter(
      (s) => !this.#moveTargetZoneId() || s.zoneId === this.#moveTargetZoneId(),
    ),
  );
  readonly moveFilteredLayers = computed(() =>
    this.#refLayers().filter(
      (l) => !this.#moveTargetSystemId() || l.systemId === this.#moveTargetSystemId(),
    ),
  );

  readonly movingItemMaxQty = computed(() => this.#movingItem()?.quantity ?? 0);

  readonly movePathSegments = computed(() => {
    const segments: string[] = [];
    const loc = this.#refLocations().find((l) => l.id === this.#moveTargetLocationId());
    if (loc?.name) segments.push(loc.name);
    const gh = this.moveFilteredGhs().find((g) => g.id === this.#moveTargetGhId());
    if (gh?.name) segments.push(gh.name);
    const zone = this.moveFilteredZones().find((z) => z.id === this.#moveTargetZoneId());
    if (zone?.name) segments.push(zone.name);
    const sys = this.moveFilteredSystems().find((s) => s.id === this.#moveTargetSystemId());
    if (sys?.name) segments.push(sys.name);
    const layer = this.moveFilteredLayers().find((l) => l.id === this.#moveTargetLayerId());
    if (layer?.name) segments.push(layer.name);
    return segments;
  });

  readonly canConfirmMove = computed(() => {
    const qty = this.#moveQuantity();
    const max = this.movingItemMaxQty();
    return !!this.#moveTargetLayerId() && qty > 0 && qty <= max;
  });

  #apiFilters(f: AllocationFilters): Partial<ApiDistributionFetchParams> {
    const params: Record<string, number> = {};
    if (f.locationId !== 'all') params['LocationId'] = Number(f.locationId);
    if (f.greenhouseId !== 'all') params['UnitId'] = Number(f.greenhouseId);
    if (f.zoneId !== 'all') params['ZoneId'] = Number(f.zoneId);
    if (f.systemId !== 'all') params['SystemId'] = Number(f.systemId);
    if (f.pipeId !== 'all') params['PipeId'] = Number(f.pipeId);
    return params;
  }

  #loadReferenceData(): void {
    this.#repo
      .getRefLocations()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((items) => this.#refLocations.set(items));
    this.#repo
      .getRefGreenhouses()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((items) => this.#refGreenhouses.set(items));
    this.#repo
      .getRefZones()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((items) => this.#refZones.set(items));
    this.#repo
      .getRefSystems()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((items) => this.#refSystems.set(items));
    this.#repo
      .getRefLayers()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((items) => this.#refLayers.set(items));
    this.#repo
      .getRefPipes()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((items) => this.#refPipes.set(items));
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  enterPage(): void {
    this.#filters.set(DEFAULT_ALLOCATION_FILTERS);
    this.#pageNumber.set(1);
    this.#loadReferenceData();
    this.#reloadNow$.next();
  }

  confirmMove(): void {
    const item = this.#movingItem();
    if (!item || !this.canConfirmMove()) return;
    const dto: MoveAllocationDto = {
      allocationId: item.id,
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
    const item = this.#lossingItem();
    if (!item) return;
    const snapshot = this.#items();
    this.#items.update((list) =>
      list.map((a) => (a.id === item.id ? { ...a, quantity: a.quantity - dto.quantity } : a)),
    );
    this.closeLossModal();

    this.#repo
      .recordLoss(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (updated) => {
          this.#items.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
          this.#toast.success(this.#i18n.t('losses.toast_create_success'));
        },
        error: () => {
          this.#items.set(snapshot);
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
    this.#loadBatchHistory(item.batchId, { excludeLoss: true });
  }

  closeHistoryModal(): void {
    this.#isHistoryModalOpen.set(false);
    this.#viewingHistoryItem.set(null);
    this.#historyEntries.set([]);
    this.#historyLoading.set(false);
  }

  openLossHistoryModal(item: AllocationRow): void {
    this.#viewingLossItem.set(item);
    this.#isLossHistModalOpen.set(true);
  }

  closeLossHistoryModal(): void {
    this.#isLossHistModalOpen.set(false);
    this.#viewingLossItem.set(null);
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

  #loadBatchHistory(
    batchId: string,
    opts: { excludeLoss?: boolean; onlyLoss?: boolean } = {},
  ): void {
    this.#historyLoading.set(true);
    this.#historyEntries.set([]);
    this.#batchHistoryRepo
      .getHistory(batchId)
      .pipe(
        finalize(() => this.#historyLoading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (entries) => {
          let list = entries;
          if (opts.excludeLoss) {
            list = list.filter((e) => e.actionType !== StockActionType.Loss);
          }
          if (opts.onlyLoss) {
            list = list.filter((e) => e.actionType === StockActionType.Loss);
          }
          this.#historyEntries.set(list);
        },
        error: () => this.#historyEntries.set([]),
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
