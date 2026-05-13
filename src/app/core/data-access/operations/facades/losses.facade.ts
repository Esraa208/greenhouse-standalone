import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LossesRepository } from '../repositories/losses.repository';
import {
  LossRow,
  LossFilters,
  DEFAULT_LOSS_FILTERS,
  CreateLossDto,
  LossRefLocation,
  LossRefGreenhouse,
  LossRefZone,
  LossRefSystem,
  LossRefLayer,
  LossRefAllocation,
  LossRefBatch,
} from '../models/loss.model';

@Injectable({ providedIn: 'root' })
export class LossesFacade {
  readonly #repo = inject(LossesRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #items = signal<LossRow[]>([]);
  readonly #filters = signal<LossFilters>(DEFAULT_LOSS_FILTERS);
  readonly #isModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);

  readonly #modalMode = signal<'infrastructure' | 'batch'>('infrastructure');
  readonly #selLocationId = signal('');
  readonly #selGreenhouseId = signal('');
  readonly #selZoneId = signal('');
  readonly #selSystemId = signal('');
  readonly #selLayerId = signal('');
  readonly #selAllocationId = signal('');
  readonly #selBatchId = signal('');

  readonly #refLocations = signal<LossRefLocation[]>([]);
  readonly #refGreenhouses = signal<LossRefGreenhouse[]>([]);
  readonly #refZones = signal<LossRefZone[]>([]);
  readonly #refSystems = signal<LossRefSystem[]>([]);
  readonly #refLayers = signal<LossRefLayer[]>([]);
  readonly #refAllocations = signal<LossRefAllocation[]>([]);
  readonly #refBatches = signal<LossRefBatch[]>([]);

  readonly items = this.#items.asReadonly();
  readonly filters = this.#filters.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly modalMode = this.#modalMode.asReadonly();

  readonly refLocations = this.#refLocations.asReadonly();
  readonly refBatches = this.#refBatches.asReadonly();

  readonly filteredItems = computed<LossRow[]>(() => {
    const { searchQuery, sourceType, lossType, sortBy } = this.#filters();
    let result = this.#items();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.sourceName.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }
    if (sourceType !== 'all') {
      result = result.filter((l) => l.sourceType === sourceType);
    }
    if (lossType !== 'all') {
      result = result.filter((l) => l.lossType === lossType);
    }
    return [...result].sort((a, b) => {
      if (sortBy === 'date-desc')
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  });

  readonly filteredModalGreenhouses = computed(() =>
    this.#refGreenhouses().filter((gh) => !this.#selLocationId() || gh.locationId === this.#selLocationId())
  );
  readonly filteredModalZones = computed(() =>
    this.#refZones().filter((z) => !this.#selGreenhouseId() || z.greenhouseId === this.#selGreenhouseId())
  );
  readonly filteredModalSystems = computed(() =>
    this.#refSystems().filter((s) => !this.#selZoneId() || s.zoneId === this.#selZoneId())
  );
  readonly filteredModalLayers = computed(() =>
    this.#refLayers().filter((l) => !this.#selSystemId() || l.systemId === this.#selSystemId())
  );
  readonly filteredModalAllocations = computed(() =>
    this.#refAllocations().filter((a) => !this.#selLayerId() || a.layerId === this.#selLayerId())
  );

  readonly affectedPlantsCount = computed<number>(() => {
    if (this.#selAllocationId()) {
      return this.#refAllocations().find((a) => a.id === this.#selAllocationId())?.quantity ?? 0;
    }
    if (this.#selLayerId()) {
      return this.#refLayers().find((l) => l.id === this.#selLayerId())?.totalQuantity ?? 0;
    }
    if (this.#selBatchId() && this.#modalMode() === 'batch') {
      return this.#refBatches().find((b) => b.id === this.#selBatchId())?.totalQuantity ?? 0;
    }
    return 0;
  });

  loadAll(): void {
    this.#isLoading.set(true);
    this.#repo
      .getAll()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (items) => {
          this.#items.set(items);
          this.#isLoading.set(false);
        },
        error: (err) => {
          this.#error.set(err.message);
          this.#isLoading.set(false);
        },
      });

    this.#repo.getRefLocations().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refLocations.set(d));
    this.#repo.getRefGreenhouses().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refGreenhouses.set(d));
    this.#repo.getRefZones().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refZones.set(d));
    this.#repo.getRefSystems().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refSystems.set(d));
    this.#repo.getRefLayers().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refLayers.set(d));
    this.#repo.getRefAllocations().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refAllocations.set(d));
    this.#repo.getRefBatches().pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((d) => this.#refBatches.set(d));
  }

  create(dto: CreateLossDto): void {
    this.#repo
      .create(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((newLoss) => {
        this.#items.update((items) => [newLoss, ...items]);
        this.closeModal();
      });
  }

  patchFilters(patch: Partial<LossFilters>): void {
    this.#filters.update((f) => ({ ...f, ...patch }));
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_LOSS_FILTERS);
  }

  openCreateModal(): void {
    this.setModalMode('infrastructure');
    this.#isModalOpen.set(true);
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#resetCascadeSelections();
  }

  setModalMode(mode: 'infrastructure' | 'batch'): void {
    this.#modalMode.set(mode);
    this.#resetCascadeSelections();
  }

  setLocationId(id: string): void {
    this.#selLocationId.set(id);
    this.#selGreenhouseId.set('');
    this.#selZoneId.set('');
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
  }
  setGreenhouseId(id: string): void {
    this.#selGreenhouseId.set(id);
    this.#selZoneId.set('');
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
  }
  setZoneId(id: string): void {
    this.#selZoneId.set(id);
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
  }
  setSystemId(id: string): void {
    this.#selSystemId.set(id);
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
  }
  setLayerId(id: string): void {
    this.#selLayerId.set(id);
    this.#selAllocationId.set('');
  }
  setAllocationId(id: string): void {
    this.#selAllocationId.set(id);
  }
  setBatchId(id: string): void {
    this.#selBatchId.set(id);
  }

  #resetCascadeSelections(): void {
    this.#selLocationId.set('');
    this.#selGreenhouseId.set('');
    this.#selZoneId.set('');
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
    this.#selBatchId.set('');
  }
}





