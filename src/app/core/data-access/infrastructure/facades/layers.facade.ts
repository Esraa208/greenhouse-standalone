import { LayerRow, LayerFilters, CreateLayerDto, UpdateLayerDto, mapLayerSetOrder } from '../models/layer.model';
import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GhToastService, TranslationService } from '@app/core';
import { LayersRepository } from '../repositories/layers.repository';
import { DEFAULT_PAGE_SIZE } from '../list-query';
import { Subject } from 'rxjs';
import {
  bindListReloadStream,
  applyListFilterPatch,
  applyListPaginationFromResult,
  changeListPageSize,
  subscribeMutationWithResult,
  subscribeMutationWithVoid,
} from '../entity-list-facade.helpers';
import { mergeAfterPut } from '../put-patch-merge';
import { toastInfrastructureCrudSuccess } from '../infrastructure-crud-toast.helper';

@Injectable({ providedIn: 'root' })
export class LayersFacade {
  readonly #repo = inject(LayersRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #items = signal<LayerRow[]>([]);
  readonly #filters = signal<LayerFilters>({
    searchQuery: '',
    status: 'all',
    sortBy: 'all',
    locationId: 'all',
    greenhouseId: 'all',
    zoneId: 'all',
    systemId: 'all',
  });
  readonly #pageNumber = signal(1);
  readonly #editingItem = signal<LayerRow | null>(null);
  readonly #deletingItem = signal<LayerRow | null>(null);
  readonly #isModalOpen = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly #selectItems = signal<LayerRow[]>([]);
  readonly #selectForSystem = signal<LayerRow[]>([]);

  readonly items = this.#items.asReadonly();
  readonly selectItems = this.#selectItems.asReadonly();
  readonly selectForSystem = this.#selectForSystem.asReadonly();
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

  readonly filteredItems = computed<LayerRow[]>(() => {
    return this.#items();
  });

  readonly filteredCount = computed(() => this.filteredItems().length);
  readonly hasActiveFilters = computed(
    () =>
      this.#filters().searchQuery !== '' ||
      this.#filters().status !== 'all' ||
      this.#filters().locationId !== 'all' ||
      this.#filters().greenhouseId !== 'all' ||
      this.#filters().zoneId !== 'all' ||
      this.#filters().systemId !== 'all'
  );

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
      setOrder: mapLayerSetOrder(f.sortBy),
      extra: {
        LocationId: f.locationId === 'all' ? '' : f.locationId,
        UnitId: f.greenhouseId === 'all' ? '' : f.greenhouseId,
        ZoneId: f.zoneId === 'all' ? '' : f.zoneId,
        SystemId: f.systemId === 'all' ? '' : f.systemId,
      },
    };
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  /** Route-entry reset: first request sends only `PageNumber=1`. */
  enterPage(): void {
    this.#filters.set({
      searchQuery: '',
      status: 'all',
      sortBy: 'all',
      locationId: 'all',
      greenhouseId: 'all',
      zoneId: 'all',
      systemId: 'all',
    });
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  loadActiveForSelect(): void {
    this.#repo
      .fetchActivePage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: (rows) => this.#selectItems.set(rows) });
  }

  loadActiveForSystem(systemId: string): void {
    const id = systemId?.trim();
    if (!id || id === 'all') {
      this.#selectForSystem.set([]);
      return;
    }
    this.#repo
      .fetchActiveBySystem(id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: (rows) => this.#selectForSystem.set(rows) });
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  patchFilters(patch: Partial<LayerFilters>): void {
    applyListFilterPatch(patch, this.#filters, this.#pageNumber, this.#reloadNow$, this.#reloadSearch$);
  }

  resetFilters(): void {
    this.#filters.set({
      searchQuery: '',
      status: 'all',
      sortBy: 'all',
      locationId: 'all',
      greenhouseId: 'all',
      zoneId: 'all',
      systemId: 'all',
    });
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  create(dto: CreateLayerDto | UpdateLayerDto): void {
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.create(dto as CreateLayerDto),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (row) => {
        this.#items.update((items) => [...items, row]);
        this.#totalCount.update(c => c + 1);
        if (row.status === 'active') {
          this.#selectItems.update((s) => [...s.filter((i) => i.id !== row.id), row]);
        }
        toastInfrastructureCrudSuccess(this.#toast, this.#i18n, 'layers', 'create');
      },
    });
  }

  update(id: string, dto: CreateLayerDto | UpdateLayerDto): void {
    const previous = this.#items().find((i) => i.id === id) ?? this.#editingItem() ?? undefined;
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.update(id, { ...dto, id } as never),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (patch) => {
        const row = mergeAfterPut(previous, patch);
        this.#items.update((items) => items.map((i) => (i.id === row.id ? row : i)));
        this.#selectItems.update((s) => {
          const rest = s.filter((i) => i.id !== row.id);
          return row.status === 'active' ? [...rest, row] : rest;
        });
        toastInfrastructureCrudSuccess(this.#toast, this.#i18n, 'layers', 'edit');
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
        this.#selectItems.update((s) => s.filter((i) => i.id !== item.id));
        toastInfrastructureCrudSuccess(this.#toast, this.#i18n, 'layers', 'delete');
      },
    });
  }

  openCreateModal(): void {
    this.#editingItem.set(null);
    this.#isModalOpen.set(true);
  }

  openEditModal(item: LayerRow): void {
    this.#editingItem.set(item);
    this.#isModalOpen.set(true);
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#editingItem.set(null);
  }

  openDeleteModal(item: LayerRow): void {
    this.#deletingItem.set(item);
    this.#isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.#isDeleteModalOpen.set(false);
    this.#deletingItem.set(null);
  }
}





