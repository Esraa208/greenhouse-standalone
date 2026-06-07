/* libs/operations/data-access/src/lib/facades/crops.facade.ts */
import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Subject } from 'rxjs';
import { CropsRepository } from '../repositories/crops.repository';
import { DEFAULT_PAGE_SIZE } from '../../infrastructure/list-query';
import { bindListReloadStream, applyListPaginationFromResult, changeListPageSize } from '../../infrastructure/entity-list-facade.helpers';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';
import { normalizeAppError } from '@app/core/errors/app-error';
import { 
  CropRow, 
  CropFilters, 
  DEFAULT_CROP_FILTERS, 
  CreateCropDto, 
  UpdateCropDto,
  mapCropSetOrder,
} from '../models/crop.model';

@Injectable({ providedIn: 'root' })
export class CropsFacade {
  // --- SECTION 1: Private deps ---
  readonly #repo = inject(CropsRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  // --- SECTION 2: Private writable signals ---
  readonly #items = signal<CropRow[]>([]);
  readonly #selectItems = signal<CropRow[]>([]);
  readonly #filters = signal(DEFAULT_CROP_FILTERS);
  readonly #pageNumber = signal(1);
  readonly #editingItem = signal<CropRow | null>(null);
  readonly #deletingItem = signal<CropRow | null>(null);
  readonly #isModalOpen = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  // --- SECTION 3: Public readonly accessors ---
  readonly selectItems = this.#selectItems.asReadonly();
  readonly filters = this.#filters.asReadonly();
  readonly editingItem = this.#editingItem.asReadonly();
  readonly deletingItem = this.#deletingItem.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isDeleteModalOpen = this.#isDeleteModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();

  // --- SECTION 4: Computed signals ---
  
  /** Server-filtered and sorted items loaded from API. */
  readonly filteredItems = computed<CropRow[]>(() => {
    return this.#items();
  });

  /** 
   * Safety check for crop deletion.
   * Prevents deleting crops that are currently assigned to active batches.
   */
  canDelete = (id: string): boolean =>
    (this.#items().find(c => c.id === id)?.activeBatches ?? 0) === 0;

  // --- SECTION 5: Methods ---

  constructor() {
    bindListReloadStream({
      destroyRef: this.#destroyRef,
      reloadNow$: this.#reloadNow$,
      reloadSearch$: this.#reloadSearch$,
      load: () => this.#repo.getAll(this.#listQuery()),
      setItems: (items) => this.#items.set(items),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      setPagination: (p) => applyListPaginationFromResult(p, this.#totalCount, this.#totalPages),
    });
  }

  #listQuery() {
    const f = this.#filters();
    return {
      pageNumber: this.#pageNumber(),
      pageSize: this.#pageSize(),
      search: f.searchQuery,
      status: f.status,
      setOrder: mapCropSetOrder(f.sortBy),
    };
  }

  /** Loads all records from repository (server-side search/sort applied). */
  loadAll(): void {
    this.#reloadNow$.next();
  }

  /** Active crop types for filter dropdowns and selects. */
  loadActiveForSelect(): void {
    this.#repo
      .fetchActivePage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: (rows) => this.#selectItems.set(rows) });
  }

  /** Creates a new crop; list row uses `id` returned by the API. */
  create(dto: CreateCropDto): void {
    this.#isModalOpen.set(false);
    this.#isLoading.set(true);
    this.#repo
      .create(dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#isLoading.set(false))
      )
      .subscribe({
        next: (savedRow) => {
          this.#items.update((items) => [...items, savedRow]);
          this.#totalCount.update(c => c + 1);
          this.#toast.success(this.#i18n.t('crops.toast_create_success'));
        },
        error: (err: unknown) => {
          this.#error.set(normalizeAppError(err).message);
        },
      });
  }

  /** Updates an existing crop with optimistic rollback support */
  update(id: string, dto: UpdateCropDto): void {
    const previousItems = this.#items();
    this.#items.update(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              name: dto.name,
              growthDuration: dto.growthDuration,
              status: dto.status,
            }
          : item
      )
    );
    this.#isModalOpen.set(false);

    this.#repo.update(id, dto).subscribe({
      next: () => {
        this.#toast.success(this.#i18n.t('crops.toast_edit_success'));
      },
      error: (err: unknown) => {
        this.#items.set(previousItems);
        this.#error.set(normalizeAppError(err).message);
      }
    });
  }

  /** Confirms and executes crop deletion with optimistic rollback */
  confirmDelete(): void {
    const item = this.#deletingItem();
    if (!item) return;

    const previousItems = this.#items();
    this.#items.update(items => items.filter(i => i.id !== item.id));
    this.#isDeleteModalOpen.set(false);

    this.#repo.delete(item.id).subscribe({
      next: () => {
        this.#totalCount.update(c => Math.max(0, c - 1));
        this.#toast.success(this.#i18n.t('crops.toast_delete_success'));
      },
      error: (err: unknown) => {
        this.#items.set(previousItems);
        this.#error.set(normalizeAppError(err).message);
      }
    });
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  /** Patches partial filter state */
  patchFilters(patch: Partial<CropFilters>): void {
    this.#filters.update((f) => ({ ...f, ...patch }));
    if (Object.prototype.hasOwnProperty.call(patch, 'searchQuery')) {
      this.#pageNumber.set(1);
      this.#reloadSearch$.next();
      return;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'sortBy') || Object.prototype.hasOwnProperty.call(patch, 'status')) {
      this.#pageNumber.set(1);
      this.#reloadNow$.next();
    }
  }

  /** Resets filters to default values */
  resetFilters(): void {
    this.#filters.set(DEFAULT_CROP_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  /** Prepares for crop creation */
  openCreateModal(): void {
    this.#editingItem.set(null);
    this.#isModalOpen.set(true);
  }

  /** Prepares for crop editing */
  openEditModal(item: CropRow): void {
    this.#editingItem.set(item);
    this.#isModalOpen.set(true);
  }

  /** Closes create/edit modal */
  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#editingItem.set(null);
  }

  /** Initiates deletion flow */
  openDeleteModal(item: CropRow): void {
    this.#deletingItem.set(item);
    this.#isDeleteModalOpen.set(true);
  }

  /** Aborts deletion flow */
  closeDeleteModal(): void {
    this.#isDeleteModalOpen.set(false);
    this.#deletingItem.set(null);
  }
}






