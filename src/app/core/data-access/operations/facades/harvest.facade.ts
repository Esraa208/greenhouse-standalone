import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HarvestRepository } from '../repositories/harvest.repository';
import { HarvestRow, CreateHarvestDto, HarvestRefCustomer, HarvestFilters, DEFAULT_HARVEST_FILTERS } from '../models/harvest.model';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, finalize } from 'rxjs/operators';
import { bindListReloadStream, applyListFilterPatch, applyListPaginationFromResult, extractApiErrorMessage, changeListPageSize } from '../../infrastructure/entity-list-facade.helpers';
import { DEFAULT_PAGE_SIZE } from '../../infrastructure/list-query';

@Injectable({ providedIn: 'root' })
export class HarvestFacade {
  readonly #repo = inject(HarvestRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #items = signal<HarvestRow[]>([]);
  readonly #isModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #customers = signal<HarvestRefCustomer[]>([]);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly #filters = signal<HarvestFilters>(DEFAULT_HARVEST_FILTERS);
  readonly #pageNumber = signal(1);
  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly #addedLayers = signal<string[]>([]);

  readonly #allocationQtys = signal<Record<string, number>>({});

  readonly items = this.#items.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly filters = this.#filters.asReadonly();
  readonly customers = this.#customers.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();
  readonly addedLayers = this.#addedLayers.asReadonly();
  readonly allocationQtys = this.#allocationQtys.asReadonly();

  constructor() {
    bindListReloadStream({
      destroyRef: this.#destroyRef,
      reloadNow$: this.#reloadNow$,
      reloadSearch$: this.#reloadSearch$,
      load: () => {
        const f = this.#filters();
        return this.#repo.getAll({
          pageNumber: this.#pageNumber(),
          pageSize: this.#pageSize(),
          search: f.searchQuery,
          status: f.status,
        });
      },
      setItems: (items) => this.#items.set(items),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      setPagination: (p) =>
        applyListPaginationFromResult(p, this.#totalCount, this.#totalPages, this.#pageNumber),
    });
  }

  readonly totalHarvestedPlants = computed(() =>
    Object.values(this.#allocationQtys()).reduce((sum, qty) => sum + qty, 0)
  );

  netWeight(totalWeight: number, hasRoots: boolean, rootGramsPerPlant: number): number {
    if (!hasRoots) return totalWeight;
    const totalRootKg = (rootGramsPerPlant * this.totalHarvestedPlants()) / 1000;
    return Math.max(0, totalWeight - totalRootKg);
  }

  totalValue(netWeight: number, pricePerKg: number): number {
    return netWeight * pricePerKg;
  }

  loadAll(): void {
    // Customers only loaded once usually, but keeping it here
    this.#repo
      .getCustomers()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((data) => this.#customers.set(data));
      
    this.enterPage();
  }

  enterPage(): void {
    this.#reloadNow$.next();
  }

  patchFilters(patch: Partial<HarvestFilters>): void {
    applyListFilterPatch(
      patch,
      this.#filters,
      this.#pageNumber,
      this.#reloadNow$,
      this.#reloadSearch$
    );
  }



  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  create(dto: CreateHarvestDto): void {
    this.#repo
      .create(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((newHarvest) => {
        this.#items.update((items) => [newHarvest, ...items]);
        this.closeModal();
      });
  }

  openCreateModal(): void {
    this.#isModalOpen.set(true);
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#addedLayers.set([]);
    this.#allocationQtys.set({});
  }

  addLayer(key: string): void {
    if (!this.#addedLayers().includes(key)) {
      this.#addedLayers.update((layers) => [...layers, key]);
      // Mock setting some allocation quantity
      this.setAllocationQty(key + '-alloc', 50);
    }
  }

  removeLayer(key: string): void {
    this.#addedLayers.update((layers) => layers.filter((l) => l !== key));
    this.#allocationQtys.update((qtys) => {
      const newQtys = { ...qtys };
      delete newQtys[key + '-alloc'];
      return newQtys;
    });
  }

  setAllocationQty(allocationId: string, qty: number): void {
    this.#allocationQtys.update((qtys) => ({
      ...qtys,
      [allocationId]: qty,
    }));
  }
}





