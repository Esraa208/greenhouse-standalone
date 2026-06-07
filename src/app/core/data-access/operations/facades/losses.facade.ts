import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, finalize, forkJoin, of, Subject, switchMap } from 'rxjs';
import { LossesRepository } from '../repositories/losses.repository';
import { GhToastService, TranslationService } from '@app/core';
import { normalizeAppError } from '@app/core/errors/app-error';
import {
  LossRow,
  LossFilters,
  DEFAULT_LOSS_FILTERS,
  CreateLossDto,
  buildLossFetchExtraParams,
  LossRefLocation,
  LossRefGreenhouse,
  LossRefZone,
  LossRefSystem,
  LossRefLayer,
  LossRefBatch,
} from '../models/loss.model';
import type { LossScopePreview } from '../models/loss-preview.model';
import { bindListReloadStream, applyListFilterPatch, applyListPaginationFromResult, changeListPageSize } from '../../infrastructure/entity-list-facade.helpers';
import { DEFAULT_PAGE_SIZE } from '../../infrastructure/list-query';
import type { CreateBatchLossDto } from '../models/loss-registration.model';
import type { ApiLossPreviewParams } from '@app/core/data-access/api';

@Injectable({ providedIn: 'root' })
export class LossesFacade {
  readonly #repo = inject(LossesRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #items = signal<LossRow[]>([]);
  readonly #filters = signal<LossFilters>(DEFAULT_LOSS_FILTERS);
  readonly #isModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);

  readonly #pageNumber = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();
  readonly #previewRequest$ = new Subject<void>();

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
  readonly #refBatches = signal<LossRefBatch[]>([]);
  readonly #preview = signal<LossScopePreview | null>(null);
  readonly #previewLoading = signal(false);
  readonly #refLoading = signal(false);

  readonly items = this.#items.asReadonly();
  readonly filters = this.#filters.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly modalMode = this.#modalMode.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();

  readonly selLocationId = this.#selLocationId.asReadonly();
  readonly selGreenhouseId = this.#selGreenhouseId.asReadonly();
  readonly selZoneId = this.#selZoneId.asReadonly();
  readonly selSystemId = this.#selSystemId.asReadonly();
  readonly selLayerId = this.#selLayerId.asReadonly();
  readonly selAllocationId = this.#selAllocationId.asReadonly();
  readonly selBatchId = this.#selBatchId.asReadonly();
  readonly preview = this.#preview.asReadonly();
  readonly previewLoading = this.#previewLoading.asReadonly();
  readonly refLoading = this.#refLoading.asReadonly();

  readonly refLocations = this.#refLocations.asReadonly();
  readonly refBatches = this.#refBatches.asReadonly();

  readonly filteredItems = computed<LossRow[]>(() => this.#items());

  readonly filteredModalGreenhouses = computed(() => {
    const locId = this.#selLocationId();
    if (!locId) return [];
    return this.#refGreenhouses().filter((gh) => gh.locationId === locId);
  });

  readonly filteredModalZones = computed(() => {
    const ghId = this.#selGreenhouseId();
    const locId = this.#selLocationId();
    if (ghId) return this.#refZones().filter((z) => z.greenhouseId === ghId);
    if (locId) {
      const ghIds = new Set(
        this.#refGreenhouses().filter((g) => g.locationId === locId).map((g) => g.id),
      );
      return this.#refZones().filter((z) => ghIds.has(z.greenhouseId));
    }
    return [];
  });

  readonly filteredModalSystems = computed(() => {
    const zoneId = this.#selZoneId();
    if (!zoneId) return [];
    return this.#refSystems().filter((s) => s.zoneId === zoneId);
  });

  readonly filteredModalLayers = computed(() => {
    const sysId = this.#selSystemId();
    if (!sysId) return [];
    return this.#refLayers().filter((l) => l.systemId === sysId);
  });

  readonly modalHousingOptions = computed(() => {
    const preview = this.#preview();
    if (!preview) return [];
    const layerId = this.#selLayerId();
    let housings = preview.housings;
    if (layerId) {
      housings = housings.filter((h) => h.layerId === layerId);
    }
    return housings.map((h) => ({
      value: h.id,
      label: h.pathLabel
        ? `${h.pathLabel} (${h.quantity})`
        : `${h.id} (${h.quantity})`,
    }));
  });

  readonly selectedHousingQuantity = computed(() => {
    const housingId = this.#selAllocationId();
    if (!housingId) return 0;
    return this.#preview()?.housings.find((h) => h.id === housingId)?.quantity ?? 0;
  });

  readonly showPreview = computed(() => {
    if (this.#modalMode() === 'batch') return !!this.#selBatchId();
    return !!this.#selLocationId();
  });

  constructor() {
    bindListReloadStream({
      destroyRef: this.#destroyRef,
      reloadNow$: this.#reloadNow$,
      reloadSearch$: this.#reloadSearch$,
      load: () => {
        const f = this.#filters();
        const extra = buildLossFetchExtraParams(f);

        return this.#repo.getAll({
          pageNumber: this.#pageNumber(),
          pageSize: this.#pageSize(),
          search: f.searchQuery,
          extra: Object.keys(extra).length > 0 ? extra : undefined,
        });
      },
      setItems: (items) => this.#items.set(items),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      setPagination: (p) =>
        applyListPaginationFromResult(p, this.#totalCount, this.#totalPages, this.#pageNumber),
    });

    this.#previewRequest$
      .pipe(
        debounceTime(250),
        switchMap(() => {
          const params = this.#buildPreviewParams();
          if (!params) {
            this.#preview.set(null);
            return of(null);
          }
          this.#previewLoading.set(true);
          return this.#repo.previewScope(params).pipe(
            catchError(() => of(null)),
            finalize(() => this.#previewLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((preview) => this.#preview.set(preview));
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  patchFilters(patch: Partial<LossFilters>): void {
    applyListFilterPatch(
      patch,
      this.#filters,
      this.#pageNumber,
      this.#reloadNow$,
      this.#reloadSearch$,
    );
  }

  enterPage(): void {
    this.#filters.set(DEFAULT_LOSS_FILTERS);
    this.#pageNumber.set(1);
    this.loadAll();
  }

  refresh(): void {
    this.#reloadNow$.next();
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  create(dto: CreateLossDto): void {
    this.#isModalOpen.set(false);
    this.#isLoading.set(true);
    this.#repo
      .create(dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.#toast.success(this.#i18n.t('losses.toast_create_success'));
          this.#reloadNow$.next();
        },
        error: (err: unknown) => {
          this.#error.set(normalizeAppError(err).message);
        },
      });
  }

  createBatchLoss(dto: CreateBatchLossDto): void {
    this.#isModalOpen.set(false);
    this.#isLoading.set(true);
    this.#repo
      .createBatchLoss(dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.#toast.success(this.#i18n.t('losses.toast_create_success'));
          this.#reloadNow$.next();
        },
        error: (err: unknown) => {
          this.#error.set(normalizeAppError(err).message);
        },
      });
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_LOSS_FILTERS);
  }

  openCreateModal(): void {
    this.#modalMode.set('infrastructure');
    this.#resetCascadeSelections();
    this.#isModalOpen.set(true);
    this.#loadModalRefData();
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#resetCascadeSelections();
    this.#preview.set(null);
  }

  setModalMode(mode: 'infrastructure' | 'batch'): void {
    this.#modalMode.set(mode);
    this.#resetCascadeSelections();
    this.#requestPreview();
  }

  setLocationId(id: string): void {
    this.#selLocationId.set(id);
    this.#selGreenhouseId.set('');
    this.#selZoneId.set('');
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
    this.#requestPreview();
  }

  setGreenhouseId(id: string): void {
    this.#selGreenhouseId.set(id);
    this.#selZoneId.set('');
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
    this.#requestPreview();
  }

  setZoneId(id: string): void {
    this.#selZoneId.set(id);
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
    this.#requestPreview();
  }

  setSystemId(id: string): void {
    this.#selSystemId.set(id);
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
    this.#requestPreview();
  }

  setLayerId(id: string): void {
    this.#selLayerId.set(id);
    this.#selAllocationId.set('');
    this.#requestPreview();
  }

  setAllocationId(id: string): void {
    this.#selAllocationId.set(id);
  }

  setBatchId(id: string): void {
    this.#selBatchId.set(id);
    this.#requestPreview();
  }

  #loadModalRefData(): void {
    if (this.#refLocations().length > 0 && this.#refBatches().length > 0) return;
    this.#refLoading.set(true);
    forkJoin({
      locations: this.#repo.getRefLocations(),
      greenhouses: this.#repo.getRefGreenhouses(),
      zones: this.#repo.getRefZones(),
      systems: this.#repo.getRefSystems(),
      layers: this.#repo.getRefLayers(),
      batches: this.#repo.getRefBatches(),
    })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#refLoading.set(false)),
      )
      .subscribe({
        next: ({ locations, greenhouses, zones, systems, layers, batches }) => {
          this.#refLocations.set(locations);
          this.#refGreenhouses.set(greenhouses);
          this.#refZones.set(zones);
          this.#refSystems.set(systems);
          this.#refLayers.set(layers);
          this.#refBatches.set(batches);
        },
      });
  }

  #buildPreviewParams(): ApiLossPreviewParams | null {
    if (this.#modalMode() === 'batch') {
      const batchId = this.#selBatchId();
      return batchId ? { StockBatchId: Number(batchId) } : null;
    }

    const locationId = this.#selLocationId();
    if (!locationId) return null;

    const greenhouseId = this.#selGreenhouseId();
    const zoneId = this.#selZoneId();
    const systemId = this.#selSystemId();
    const layerId = this.#selLayerId();
    return {
      LocationId: Number(locationId),
      ...(greenhouseId ? { UnitId: Number(greenhouseId) } : {}),
      ...(zoneId ? { ZoneId: Number(zoneId) } : {}),
      ...(systemId ? { SystemId: Number(systemId) } : {}),
      ...(layerId ? { LayerId: Number(layerId) } : {}),
    };
  }

  #requestPreview(): void {
    this.#previewRequest$.next();
  }

  #resetCascadeSelections(): void {
    this.#selLocationId.set('');
    this.#selGreenhouseId.set('');
    this.#selZoneId.set('');
    this.#selSystemId.set('');
    this.#selLayerId.set('');
    this.#selAllocationId.set('');
    this.#selBatchId.set('');
    this.#preview.set(null);
  }
}
