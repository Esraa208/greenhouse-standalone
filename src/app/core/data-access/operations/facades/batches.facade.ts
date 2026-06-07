import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BatchesRepository } from '../repositories/batches.repository';
import { BatchRow, BatchFilters, DEFAULT_BATCH_FILTERS, CreateBatchDto, UpdateBatchDto, mapBatchSetOrder } from '../models/batch.model';
import { DEFAULT_PAGE_SIZE, PagedListQuery } from '../../infrastructure/list-query';
import {
  bindListReloadStream,
  applyListFilterPatch, applyListPaginationFromResult, changeListPageSize,
  subscribeMutationWithResult,
  subscribeMutationWithVoid,
} from '../../infrastructure/entity-list-facade.helpers';
import { mergeAfterPut } from '../../infrastructure/put-patch-merge';
import { GhToastService, TranslationService } from '@app/core';

export interface CreateBatchOptions {
  /** Skip default success toast (e.g. wizard shows its own flow). */
  suppressToast?: boolean;
  afterSuccess?: () => void;
  afterError?: () => void;
}

@Injectable({ providedIn: 'root' })
export class BatchesFacade {
  readonly #repo = inject(BatchesRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #items = signal<BatchRow[]>([]);
  readonly #selectItems = signal<BatchRow[]>([]);
  readonly #filters = signal<BatchFilters>(DEFAULT_BATCH_FILTERS);
  readonly #pageNumber = signal(1);
  readonly #editingItem = signal<BatchRow | null>(null);
  readonly #deletingItem = signal<BatchRow | null>(null);
  readonly #isModalOpen = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #viewingItem = signal<BatchRow | null>(null);
  readonly #isDetailsModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly items = this.#items.asReadonly();
  readonly selectItems = this.#selectItems.asReadonly();
  readonly filters = this.#filters.asReadonly();
  readonly editingItem = this.#editingItem.asReadonly();
  readonly deletingItem = this.#deletingItem.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isDeleteModalOpen = this.#isDeleteModalOpen.asReadonly();
  readonly viewingItem = this.#viewingItem.asReadonly();
  readonly isDetailsModalOpen = this.#isDetailsModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();

  readonly filteredItems = computed<BatchRow[]>(() => this.#items());

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

  #listQuery(): PagedListQuery {
    const f = this.#filters();
    const extra: Record<string, string | number | boolean> = {};
    if (f.cropTypeId) extra['CropTypeId'] = Number(f.cropTypeId);
    if (f.locationId && f.locationId !== 'all') extra['LocationId'] = Number(f.locationId);
    if (f.unitId && f.unitId !== 'all') extra['UnitId'] = Number(f.unitId);
    if (f.status === 'active') extra['Status'] = 'active';
    if (f.status === 'harvested' || f.status === 'lost') extra['Status'] = 'harvested';
    return {
      pageNumber: this.#pageNumber(),
      pageSize: this.#pageSize(),
      search: f.searchQuery,
      setOrder: mapBatchSetOrder(f.sortBy),
      extra,
    };
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  enterPage(): void {
    this.#filters.set(DEFAULT_BATCH_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  loadActiveForSelect(): void {
    this.#repo
      .fetchActivePage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: (rows) => this.#selectItems.set(rows) });
  }

  /** Batch filter dropdowns — all batches, no Active filter. */
  loadForSelect(): void {
    this.#repo
      .fetchSelectPage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: (rows) => this.#selectItems.set(rows) });
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  patchFilters(patch: Partial<BatchFilters>): void {
    applyListFilterPatch(patch, this.#filters, this.#pageNumber, this.#reloadNow$, this.#reloadSearch$);
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_BATCH_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  create(dto: CreateBatchDto, options?: CreateBatchOptions): void {
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.create(dto).pipe(switchMap(() => this.#repo.getAll(this.#listQuery()))),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (page) => {
        this.#items.set(page.items);
        this.#totalCount.set(page.totalCount);
        this.#totalPages.set(page.totalPages);
        if (!options?.suppressToast) {
          this.#toast.success(this.#i18n.t('batches.toast_create_success'));
        }
        options?.afterSuccess?.();
      },
      onError: () => {
        options?.afterError?.();
      },
    });
  }

  update(id: string, dto: UpdateBatchDto): void {
    const previous = this.#items().find((i) => i.id === id) ?? this.#editingItem() ?? undefined;
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.update(id, dto),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (patch) => {
        const row = mergeAfterPut(previous, patch);
        this.#items.update((items) => items.map((i) => (i.id === row.id ? row : i)));
        this.#toast.success(this.#i18n.t('batches.toast_edit_success'));
      },
    });
  }

  confirmDelete(): void {
    const item = this.#deletingItem();
    if (!item) return;
    this.closeDeleteModal();
    subscribeMutationWithVoid({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.delete(item.id),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: () => {
        this.#items.update((items) => items.filter((i) => i.id !== item.id));
        this.#totalCount.update(c => Math.max(0, c - 1));
        this.#toast.success(this.#i18n.t('batches.toast_delete_success'));
      },
    });
  }

  openCreateModal(): void {
    this.#editingItem.set(null);
    this.#isModalOpen.set(true);
  }

  openEditModal(item: BatchRow): void {
    this.#editingItem.set(item);
    this.#isModalOpen.set(true);
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#editingItem.set(null);
  }

  openDeleteModal(item: BatchRow): void {
    this.#deletingItem.set(item);
    this.#isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.#isDeleteModalOpen.set(false);
    this.#deletingItem.set(null);
  }

  openDetailsModal(item: BatchRow): void {
    this.#viewingItem.set(item);
    this.#isDetailsModalOpen.set(true);
  }

  closeDetailsModal(): void {
    this.#isDetailsModalOpen.set(false);
    this.#viewingItem.set(null);
  }
}
