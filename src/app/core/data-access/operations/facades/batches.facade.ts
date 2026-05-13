/* libs/operations/data-access/src/lib/facades/batches.facade.ts */
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BatchesRepository } from '../repositories/batches.repository';
import { DeleteBatchUseCase } from '../use-cases/delete-batch.use-case';
import {
  BatchRow,
  BatchFilters,
  DEFAULT_BATCH_FILTERS,
  BatchStatus,
} from '../models/batch.model';

@Injectable({ providedIn: 'root' })
export class BatchesFacade {
  // --- SECTION 1: Private deps ---
  readonly #repo = inject(BatchesRepository);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #deleteBatch = inject(DeleteBatchUseCase);

  // --- SECTION 2: Private writable signals ---
  readonly #items = signal<BatchRow[]>([]);
  readonly #filters = signal(DEFAULT_BATCH_FILTERS);
  readonly #viewingItem = signal<BatchRow | null>(null);
  readonly #deletingItem = signal<BatchRow | null>(null);
  readonly #isViewModalOpen = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);

  // --- SECTION 3: Public readonly accessors ---
  readonly filters = this.#filters.asReadonly();
  readonly viewingItem = this.#viewingItem.asReadonly();
  readonly deletingItem = this.#deletingItem.asReadonly();
  readonly isViewModalOpen = this.#isViewModalOpen.asReadonly();
  readonly isDeleteModalOpen = this.#isDeleteModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  // --- SECTION 4: Computed signals ---

  /** Unique crop types extracted from current batches for filter dropdown */
  readonly cropTypes = computed(() =>
    [...new Set(this.#items().map(b => b.cropType))].sort((a, b) => a.localeCompare(b, 'ar'))
  );

  /**
   * Filtered and sorted list based on Search, Status, and Crop Type filters.
   */
  readonly filteredItems = computed<BatchRow[]>(() => {
    const { searchQuery, status, cropType, sortBy } = this.#filters();
    let result = this.#items();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.batchNumber.toLowerCase().includes(q) ||
        b.cropType.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.greenhouse.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      result = result.filter(b => b.status === status);
    }

    if (cropType) {
      result = result.filter(b => b.cropType === cropType);
    }

    const now = Date.now();
    return [...result].sort((a, b) => {
      const dateA = new Date(a.plantingDate || a.plantedDate || '').getTime();
      const dateB = new Date(b.plantingDate || b.plantedDate || '').getTime();
      switch (sortBy) {
        case 'date-desc': return dateB - dateA;
        case 'date-asc': return dateA - dateB;
        case 'quantity-desc': return b.quantity - a.quantity;
        case 'quantity-asc': return a.quantity - b.quantity;
        case 'progress-desc': return this.daysElapsed(b) - this.daysElapsed(a);
        case 'progress-asc': return this.daysElapsed(a) - this.daysElapsed(b);
        default: return 0;
      }
    });
  });

  /** Total active batches count */
  readonly activeBatchesCount = computed(() =>
    this.#items().filter(b => b.status === 'active').length
  );

  // --- SECTION 5: Pure helper methods ---

  /** Compute days elapsed since planting */
  daysElapsed(batch: BatchRow): number {
    const date = batch.plantingDate || batch.plantedDate || '';
    return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  }

  /** Compute progress percent (capped at 100) */
  progressPercent(batch: BatchRow): number {
    const days = batch.growthDurationDays || batch.totalDays || 1;
    return Math.min(100, Math.round(this.daysElapsed(batch) / days * 100));
  }

  /** Progress calculation helper for UI (legacy compat) */
  progressPct(row: BatchRow): number {
    return this.progressPercent(row);
  }

  /** Compute growth stage label translation key */
  growthStageKey(batch: BatchRow): string {
    if (batch.status === 'harvested') return 'batches.stage_harvested';
    if (batch.status === 'lost') return 'batches.stage_lost';
    const pct = this.progressPercent(batch);
    if (pct <= 25) return 'batches.stage_seedlings';
    if (pct <= 60) return 'batches.stage_vegetative';
    if (pct <= 85) return 'batches.stage_early';
    if (pct <= 100) return 'batches.stage_late';
    return 'batches.stage_overdue';
  }

  /** Progress bar variant */
  progressVariant(batch: BatchRow): 'success' | 'warning' {
    const days = batch.growthDurationDays || batch.totalDays || 1;
    return this.daysElapsed(batch) >= days ? 'warning' : 'success';
  }

  /** Days text color class */
  daysOverdue(batch: BatchRow): boolean {
    const days = batch.growthDurationDays || batch.totalDays || 1;
    return this.daysElapsed(batch) >= days;
  }

  // --- SECTION 6: Action methods ---

  /** Loads all records with lifecycle management */
  loadAll(): void {
    this.#isLoading.set(true);
    this.#repo.getAll()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#isLoading.set(false)),
      )
      .subscribe({
        next: items => this.#items.set(items),
        error: err => this.#error.set(err.message),
      });
  }

  /** Navigate to planting wizard */
  navigateToPlanting(): void {
    this.#router.navigate(['/operations/planting']);
  }

  /** Patches active filters */
  patchFilters(patch: Partial<BatchFilters>): void {
    this.#filters.update(f => ({ ...f, ...patch }));
  }

  /** Resets all filters */
  resetFilters(): void {
    this.#filters.set(DEFAULT_BATCH_FILTERS);
  }

  /** Details modal control */
  openViewModal(item: BatchRow): void {
    this.#viewingItem.set(item);
    this.#isViewModalOpen.set(true);
  }

  closeViewModal(): void {
    this.#isViewModalOpen.set(false);
    this.#viewingItem.set(null);
  }

  /** Delete modal control */
  openDeleteModal(item: BatchRow): void {
    this.#deletingItem.set(item);
    this.#isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.#isDeleteModalOpen.set(false);
    this.#deletingItem.set(null);
  }

  /** Executes batch deletion with optimistic rollback */
  confirmDelete(): void {
    const item = this.#deletingItem();
    if (!item) return;

    const previousItems = this.#items();
    this.#deleteBatch.execute({
      destroyRef: this.#destroyRef,
      item,
      previousItems,
      applyOptimisticDelete: (id) =>
        this.#items.update((items) => items.filter((i) => i.id !== id)),
      rollback: (items) => this.#items.set(items),
      setError: (message) => this.#error.set(message),
      closeModal: () => this.#isDeleteModalOpen.set(false),
    });
  }
}






