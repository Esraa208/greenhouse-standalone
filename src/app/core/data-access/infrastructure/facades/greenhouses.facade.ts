import { GreenhouseRow, GreenhouseFilters, CreateGreenhouseDto, UpdateGreenhouseDto } from '../models/greenhouse.model';
import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GreenhousesRepository } from '../repositories/greenhouses.repository';
import { Subject } from 'rxjs';
import {
  bindListReloadStream,
  applyListFilterPatch,
  subscribeMutationWithResult,
  subscribeMutationWithVoid,
} from '../entity-list-facade.helpers';
import { mergeAfterPut } from '../put-patch-merge';

@Injectable({ providedIn: 'root' })
export class GreenhousesFacade {
  readonly #repo = inject(GreenhousesRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #items = signal<GreenhouseRow[]>([]);
  readonly #filters = signal<GreenhouseFilters>({
    searchQuery: '',
    status: 'all',
    sortBy: 'all',
    locationId: 'all',
  });
  readonly #pageNumber = signal(1);
  readonly #editingItem = signal<GreenhouseRow | null>(null);
  readonly #deletingItem = signal<GreenhouseRow | null>(null);
  readonly #isModalOpen = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(50);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly #selectItems = signal<GreenhouseRow[]>([]);

  readonly items = this.#items.asReadonly();
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

  readonly filteredItems = computed<GreenhouseRow[]>(() => {
    return this.#items();
  });

  readonly filteredCount = computed(() => this.filteredItems().length);
  readonly hasActiveFilters = computed(
    () =>
      this.#filters().searchQuery !== '' ||
      this.#filters().status !== 'all' ||
      this.#filters().locationId !== 'all'
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
      setPagination: (p) => {
        this.#totalCount.set(p.totalCount);
        this.#totalPages.set(p.totalPages);
        this.#pageSize.set(p.pageSize);
      },
    });
  }

  #listQuery() {
    const f = this.#filters();
    return {
      pageNumber: this.#pageNumber(),
      search: f.searchQuery,
      status: f.status,
      setOrder: f.sortBy,
      extra: f.locationId === 'all' ? undefined : { LocationId: f.locationId },
    };
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  /** Route-entry reset: first request sends only `PageNumber=1`. */
  enterPage(): void {
    this.#filters.set({ searchQuery: '', status: 'all', sortBy: 'all', locationId: 'all' });
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  loadActiveForSelect(): void {
    this.#repo
      .fetchActivePage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: (rows) => this.#selectItems.set(rows) });
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  patchFilters(patch: Partial<GreenhouseFilters>): void {
    applyListFilterPatch(patch, this.#filters, this.#pageNumber, this.#reloadNow$, this.#reloadSearch$);
  }

  resetFilters(): void {
    this.#filters.set({ searchQuery: '', status: 'all', sortBy: 'all', locationId: 'all' });
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  create(dto: CreateGreenhouseDto | UpdateGreenhouseDto): void {
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.create(dto as CreateGreenhouseDto),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (row) => {
        this.#items.update((items) => [...items, row]);
        this.#totalCount.update(c => c + 1);
        if (row.status === 'active') {
          this.#selectItems.update((s) => [...s.filter((i) => i.id !== row.id), row]);
        }
      },
    });
  }

  update(id: string, dto: CreateGreenhouseDto | UpdateGreenhouseDto): void {
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
      },
    });
  }

  openCreateModal(): void {
    this.#editingItem.set(null);
    this.#isModalOpen.set(true);
  }

  openEditModal(item: GreenhouseRow): void {
    this.#editingItem.set(item);
    this.#isModalOpen.set(true);
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#editingItem.set(null);
  }

  openDeleteModal(item: GreenhouseRow): void {
    this.#deletingItem.set(item);
    this.#isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.#isDeleteModalOpen.set(false);
    this.#deletingItem.set(null);
  }
}





