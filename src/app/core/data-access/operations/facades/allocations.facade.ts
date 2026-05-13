/* libs/operations/data-access/src/lib/facades/allocations.facade.ts */
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { MoveAllocationUseCase } from '../use-cases/move-allocation.use-case';
import { RecordAllocationLossUseCase } from '../use-cases/record-allocation-loss.use-case';
import { LoadAllocationReferencesUseCase } from '../use-cases/load-allocation-references.use-case';
import {
  AllocationRow,
  AllocationFilters,
  DEFAULT_ALLOCATION_FILTERS,
  MoveAllocationDto,
  RecordAllocationLossDto,
} from '../models/allocation.model';

@Injectable({ providedIn: 'root' })
export class AllocationsFacade {
  // --- SECTION 1: Private deps ---
  readonly #repo = inject(AllocationsRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #moveAllocation = inject(MoveAllocationUseCase);
  readonly #recordAllocationLoss = inject(RecordAllocationLossUseCase);
  readonly #loadAllocationReferences = inject(LoadAllocationReferencesUseCase);

  // --- SECTION 2: Private writable signals ---
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

  // Move modal cascade
  readonly #moveTargetLocationId = signal('');
  readonly #moveTargetGhId = signal('');
  readonly #moveTargetZoneId = signal('');
  readonly #moveTargetSystemId = signal('');
  readonly #moveTargetLayerId = signal('');
  readonly #moveTargetPipeId = signal('');
  readonly #moveQuantity = signal(0);

  // Reference data for move modal
  readonly #refLocations = signal<{ id: string; name: string }[]>([]);
  readonly #refGreenhouses = signal<{ id: string; name: string; locationId: string }[]>([]);
  readonly #refZones = signal<{ id: string; name: string; greenhouseId: string }[]>([]);
  readonly #refSystems = signal<{ id: string; name: string; zoneId: string }[]>([]);
  readonly #refLayers = signal<{ id: string; name: string; systemId: string }[]>([]);
  readonly #refPipes = signal<{ id: string; name: string; layerId: string }[]>([]);

  // --- SECTION 3: Public readonly accessors ---
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

  readonly moveTargetLocationId = this.#moveTargetLocationId.asReadonly();
  readonly moveTargetGhId = this.#moveTargetGhId.asReadonly();
  readonly moveTargetZoneId = this.#moveTargetZoneId.asReadonly();
  readonly moveTargetSystemId = this.#moveTargetSystemId.asReadonly();
  readonly moveTargetLayerId = this.#moveTargetLayerId.asReadonly();
  readonly moveTargetPipeId = this.#moveTargetPipeId.asReadonly();
  readonly moveQuantity = this.#moveQuantity.asReadonly();

  readonly refLocations = this.#refLocations.asReadonly();

  // --- SECTION 4: Computed signals ---

  /** Client-side filtered + sorted list */
  readonly filteredItems = computed<AllocationRow[]>(() => {
    const {
      searchQuery, status, batchNumber,
      locationId, greenhouseId, zoneId, systemId, layerId, sortBy,
    } = this.#filters();
    let result = this.#items();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.batchNumber.toLowerCase().includes(q) ||
        a.cropType.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.greenhouse.toLowerCase().includes(q)
      );
    }
    if (status !== 'all') {
      result = result.filter(a => a.status === status);
    }
    if (batchNumber) {
      result = result.filter(a => a.batchNumber === batchNumber);
    }
    if (locationId) {
      result = result.filter(a => a.location === locationId);
    }
    if (greenhouseId) {
      result = result.filter(a => a.greenhouse === greenhouseId);
    }
    if (zoneId) {
      result = result.filter(a => a.zone === zoneId);
    }
    if (systemId) {
      result = result.filter(a => a.system === systemId);
    }
    if (layerId) {
      result = result.filter(a => a.layer === layerId);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.allocatedDate).getTime() - new Date(a.allocatedDate).getTime();
        case 'date-asc':
          return new Date(a.allocatedDate).getTime() - new Date(b.allocatedDate).getTime();
        case 'quantity-desc': return b.quantity - a.quantity;
        case 'quantity-asc':  return a.quantity - b.quantity;
        case 'batch-asc':
          return a.batchNumber.localeCompare(b.batchNumber);
        case 'batch-desc':
          return b.batchNumber.localeCompare(a.batchNumber);
        default: return 0;
      }
    });
  });

  /** Unique batch numbers for filter dropdown */
  readonly uniqueBatches = computed(() =>
    [...new Set(this.#items().map(a => a.batchNumber))].sort()
  );

  /** Unique locations for filter dropdown */
  readonly uniqueLocations = computed(() =>
    [...new Set(this.#items().map(a => a.location))].sort()
  );

  /** Filtered greenhouses for row-2 filter (by selected location) */
  readonly filterGreenhouses = computed(() => {
    const locId = this.#filters().locationId;
    if (!locId) return [...new Set(this.#items().map(a => a.greenhouse))];
    return [...new Set(
      this.#items()
        .filter(a => a.location === locId)
        .map(a => a.greenhouse)
    )];
  });

  readonly filterZones = computed(() => {
    const ghId = this.#filters().greenhouseId;
    if (!ghId) return [...new Set(this.#items().map(a => a.zone))];
    return [...new Set(
      this.#items()
        .filter(a => a.greenhouse === ghId)
        .map(a => a.zone)
    )];
  });

  readonly filterSystems = computed(() => {
    const zId = this.#filters().zoneId;
    if (!zId) return [...new Set(this.#items().map(a => a.system))];
    return [...new Set(
      this.#items()
        .filter(a => a.zone === zId)
        .map(a => a.system)
    )];
  });

  readonly filterLayers = computed(() => {
    const sId = this.#filters().systemId;
    if (!sId) return [...new Set(this.#items().map(a => a.layer))];
    return [...new Set(
      this.#items()
        .filter(a => a.system === sId)
        .map(a => a.layer)
    )];
  });

  // Move modal cascade
  readonly moveFilteredGhs = computed(() =>
    this.#refGreenhouses().filter(gh =>
      !this.#moveTargetLocationId() ||
      gh.locationId === this.#moveTargetLocationId()
    )
  );
  readonly moveFilteredZones = computed(() =>
    this.#refZones().filter(z =>
      !this.#moveTargetGhId() ||
      z.greenhouseId === this.#moveTargetGhId()
    )
  );
  readonly moveFilteredSystems = computed(() =>
    this.#refSystems().filter(s =>
      !this.#moveTargetZoneId() ||
      s.zoneId === this.#moveTargetZoneId()
    )
  );
  readonly moveFilteredLayers = computed(() =>
    this.#refLayers().filter(l =>
      !this.#moveTargetSystemId() ||
      l.systemId === this.#moveTargetSystemId()
    )
  );
  readonly moveFilteredPipes = computed(() =>
    this.#refPipes().filter(p =>
      !this.#moveTargetLayerId() ||
      p.layerId === this.#moveTargetLayerId()
    )
  );

  readonly movingItemMaxQty = computed(() =>
    this.#movingItem()?.quantity ?? 0
  );

  // --- SECTION 5: Methods ---

  /** Load all allocations and reference data */
  loadAll(): void {
    this.#isLoading.set(true);
    this.#error.set(null);
    this.#repo.getAll()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#isLoading.set(false)),
      )
      .subscribe({
        next: items => this.#items.set(items),
        error: err => this.#error.set(err.message),
      });

    this.#loadAllocationReferences.execute({
      destroyRef: this.#destroyRef,
      setLocations: (items) => this.#refLocations.set(items),
      setGreenhouses: (items) => this.#refGreenhouses.set(items),
      setZones: (items) => this.#refZones.set(items),
      setSystems: (items) => this.#refSystems.set(items),
      setLayers: (items) => this.#refLayers.set(items),
      setPipes: (items) => this.#refPipes.set(items),
      setError: (message) => this.#error.set(message),
    });
  }

  /** Optimistic move with rollback */
  confirmMove(): void {
    const item = this.#movingItem();
    if (!item) return;
    const dto: MoveAllocationDto = {
      allocationId: item.id,
      targetLocation: this.#moveTargetLocationId(),
      targetGreenhouse: this.#moveTargetGhId(),
      targetZone: this.#moveTargetZoneId(),
      targetSystem: this.#moveTargetSystemId(),
      targetLayer: this.#moveTargetLayerId(),
      targetPipeId: this.#moveTargetPipeId(),
      quantity: this.#moveQuantity(),
    };
    this.#moveAllocation.execute({
      destroyRef: this.#destroyRef,
      item,
      dto,
      closeModal: () => this.closeMoveModal(),
      applyOptimisticMove: (id) =>
        this.#items.update((list) =>
          list.map((a) => (a.id === id ? { ...a, status: 'moved' as const } : a))
        ),
      commit: (updated) =>
        this.#items.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a))
        ),
      rollback: (original) =>
        this.#items.update((list) =>
          list.map((a) => (a.id === original.id ? original : a))
        ),
    });
  }

  /** Optimistic record loss with rollback */
  confirmRecordLoss(dto: RecordAllocationLossDto): void {
    const item = this.#lossingItem();
    if (!item) return;
    const snapshot = this.#items();
    this.#recordAllocationLoss.execute({
      destroyRef: this.#destroyRef,
      item,
      dto,
      closeModal: () => this.closeLossModal(),
      snapshot,
      applyOptimisticLoss: (id, quantity) =>
        this.#items.update((list) =>
          list.map((a) => (a.id === id ? { ...a, quantity: a.quantity - quantity } : a))
        ),
      commit: (updated) =>
        this.#items.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a))
        ),
      rollback: (previous) => this.#items.set(previous),
    });
  }

  /** Patches active filters */
  patchFilters(patch: Partial<AllocationFilters>): void {
    this.#filters.update(f => ({ ...f, ...patch }));
  }

  /** Resets all filters */
  resetFilters(): void {
    this.#filters.set(DEFAULT_ALLOCATION_FILTERS);
  }

  // --- Modal controls ---

  openHistoryModal(item: AllocationRow): void {
    this.#viewingHistoryItem.set(item);
    this.#isHistoryModalOpen.set(true);
  }

  closeHistoryModal(): void {
    this.#isHistoryModalOpen.set(false);
    this.#viewingHistoryItem.set(null);
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

  // --- Move modal cascade setters ---

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
    this.#moveTargetPipeId.set('');
  }

  setMovePipeId(id: string): void {
    this.#moveTargetPipeId.set(id);
  }

  setMoveQuantity(qty: number): void {
    this.#moveQuantity.set(qty);
  }

  setMoveQuantityPct(pct: number): void {
    const max = this.movingItemMaxQty();
    this.#moveQuantity.set(Math.floor(max * pct));
  }

  #resetMoveCascade(): void {
    this.#moveTargetLocationId.set('');
    this.#moveTargetGhId.set('');
    this.#moveTargetZoneId.set('');
    this.#moveTargetSystemId.set('');
    this.#moveTargetLayerId.set('');
    this.#moveTargetPipeId.set('');
  }
}






