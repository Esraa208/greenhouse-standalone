import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HarvestRepository } from '../repositories/harvest.repository';
import { HarvestRow, CreateHarvestDto, HarvestRefCustomer } from '../models/harvest.model';

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
  readonly #pageSize = signal(50);
  readonly #pageNumber = signal(1);

  readonly #addedLayers = signal<string[]>([]);

  readonly #allocationQtys = signal<Record<string, number>>({});

  readonly items = this.#items.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly customers = this.#customers.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();
  readonly addedLayers = this.#addedLayers.asReadonly();
  readonly allocationQtys = this.#allocationQtys.asReadonly();

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
    this.#isLoading.set(true);
    this.#repo
      .getAll()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (result) => {
          this.#items.set(result.items);
          this.#totalCount.set(result.totalCount);
          this.#totalPages.set(result.totalPages);
          this.#pageSize.set(result.pageSize);
          this.#isLoading.set(false);
        },
        error: (err) => {
          this.#error.set(err.message);
          this.#isLoading.set(false);
        },
      });

    this.#repo
      .getCustomers()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((data) => this.#customers.set(data));
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.loadAll();
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





