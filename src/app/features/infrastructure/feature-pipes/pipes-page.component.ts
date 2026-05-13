import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import {
  PipesFacade,
  LayersFacade,
  SystemsFacade,
  ZonesFacade,
  GreenhousesFacade,
  LocationsFacade,
  type PipeRow,
} from '@app/core/data-access/infrastructure';
import { INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS } from '../infrastructure-crud.imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-pipes-page',
  standalone: true,
  imports: [...INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS],
  templateUrl: './pipes-page.component.html',
  styleUrl: './pipes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipesPageComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly facade = inject(PipesFacade);
  readonly layersFacade = inject(LayersFacade);
  readonly systemsFacade = inject(SystemsFacade);
  readonly zonesFacade = inject(ZonesFacade);
  readonly greenhousesFacade = inject(GreenhousesFacade);
  readonly locationsFacade = inject(LocationsFacade);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly sortOptions = computed(() => [
    { value: 'name-asc', label: this.i18n.t('sort.name_asc') },
    { value: 'name-desc', label: this.i18n.t('sort.name_desc') },
    { value: 'capacity-desc', label: this.i18n.t('sort.capacity_desc') }
  ]);

  readonly statusOptions = computed(() => [
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') }
  ]);

  readonly trackById = trackByEntityId;

  readonly form = this.#fb.nonNullable.group({
    name: ['', [Validators.required]],
    locationId: [''],
    greenhouseId: [''],
    zoneId: [''],
    systemId: [''],
    layerId: ['', [Validators.required]],
    capacity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    status: ['active' as 'active' | 'inactive']
  });

  readonly #defaultFormValue = {
    name: '', locationId: '', greenhouseId: '', zoneId: '', systemId: '', layerId: '',
    capacity: 0, status: 'active' as 'active' | 'inactive'
  };

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly filterLocations = computed(() => this.locationsFacade.selectItems());

  readonly modalLocations = computed(() => {
    const editing = this.facade.editingItem();
    return this.#withEditFallback(
      this.locationsFacade.selectItems(),
      this.locationsFacade.selectItems(),
      editing?.locationId
    );
  });

  readonly availableGreenhouses = computed(() => {
    const editing = this.facade.editingItem();
    const locId = this.formValue().locationId || editing?.locationId || '';
    if (!locId) return [];
    const base = this.greenhousesFacade.selectItems().filter((gh) => gh.locationId === locId);
    return this.#withEditFallback(base, this.greenhousesFacade.selectItems(), editing?.greenhouseId);
  });

  readonly availableZones = computed(() => {
    const editing = this.facade.editingItem();
    const ghId = this.formValue().greenhouseId || editing?.greenhouseId || '';
    if (!ghId) return [];
    const base = this.zonesFacade.selectItems().filter((z) => z.greenhouseId === ghId);
    return this.#withEditFallback(base, this.zonesFacade.selectItems(), editing?.zoneId);
  });

  readonly availableSystems = computed(() => {
    const editing = this.facade.editingItem();
    const zoneId = this.formValue().zoneId || editing?.zoneId || '';
    if (!zoneId) return [];
    const base = this.systemsFacade.selectItems().filter((s) => s.zoneId === zoneId);
    return this.#withEditFallback(base, this.systemsFacade.selectItems(), editing?.systemId);
  });

  readonly availableLayers = computed(() => {
    const editing = this.facade.editingItem();
    const sysId = this.formValue().systemId || editing?.systemId || '';
    if (!sysId) return [];
    const base = this.layersFacade.selectItems().filter((l) => l.systemId === sysId);
    return this.#withEditFallback(base, this.layersFacade.selectItems(), editing?.layerId);
  });

  readonly filteredItems = this.facade.filteredItems;

  readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    const src = this.greenhousesFacade.selectItems();
    if (locId === 'all') return src;
    return src.filter((gh) => gh.locationId === locId);
  });

  readonly filterZones = computed(() => {
    const ghId = this.facade.filters().greenhouseId;
    const src = this.zonesFacade.selectItems();
    if (ghId === 'all') {
      const locId = this.facade.filters().locationId;
      if (locId === 'all') return src;
      return src.filter((z) => z.locationId === locId);
    }
    return src.filter((z) => z.greenhouseId === ghId);
  });

  readonly filterSystems = computed(() => {
    const zoneId = this.facade.filters().zoneId;
    const src = this.systemsFacade.selectItems();
    if (zoneId === 'all') {
      const ghId = this.facade.filters().greenhouseId;
      if (ghId === 'all') {
        const locId = this.facade.filters().locationId;
        if (locId === 'all') return src;
        return src.filter((s) => s.locationId === locId);
      }
      return src.filter((s) => s.greenhouseId === ghId);
    }
    return src.filter((s) => s.zoneId === zoneId);
  });

  readonly filterLayers = computed(() => {
    const sysId = this.facade.filters().systemId;
    const src = this.layersFacade.selectItems();
    if (sysId === 'all') {
      const zoneId = this.facade.filters().zoneId;
      if (zoneId === 'all') {
        const ghId = this.facade.filters().greenhouseId;
        if (ghId === 'all') {
          const locId = this.facade.filters().locationId;
          if (locId === 'all') return src;
          return src.filter((l) => l.locationId === locId);
        }
        return src.filter((l) => l.greenhouseId === ghId);
      }
      return src.filter((l) => l.zoneId === zoneId);
    }
    return src.filter((l) => l.systemId === sysId);
  });

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          locationId: item.locationId,
          greenhouseId: item.greenhouseId,
          zoneId: item.zoneId,
          systemId: item.systemId,
          layerId: item.layerId,
          capacity: item.capacity,
          status: item.status as 'active' | 'inactive',
        }),
      defaultValue: () => ({ ...this.#defaultFormValue }),
      schedule: (run) =>
        queueMicrotask(() => {
          run();
          this.#cdr.markForCheck();
        }),
    });
  }

  ngOnInit(): void {
    this.facade.enterPage();
    this.locationsFacade.loadActiveForSelect();
    this.greenhousesFacade.loadActiveForSelect();
    this.zonesFacade.loadActiveForSelect();
    this.systemsFacade.loadActiveForSelect();
    this.layersFacade.loadActiveForSelect();
  }

  #withEditFallback<T extends { id: string }>(
    base: T[],
    all: T[],
    editingId: string | undefined | null
  ): T[] {
    const id = editingId?.trim();
    if (!id) return base;
    if (base.some((x) => x.id === id)) return base;
    const linked = all.find((x) => x.id === id);
    return linked ? [...base, linked] : base;
  }

  onStatusFilterChange(val: string) {
    this.facade.patchFilters({ status: val as never });
  }

  openEditModal(item: PipeRow): void {
    if (this.locationsFacade.items().length === 0) {
      this.locationsFacade.loadAll();
    }
    if (this.greenhousesFacade.items().length === 0) {
      this.greenhousesFacade.loadAll();
    }
    if (this.zonesFacade.items().length === 0) {
      this.zonesFacade.loadAll();
    }
    if (this.systemsFacade.items().length === 0) {
      this.systemsFacade.loadAll();
    }
    if (this.layersFacade.items().length === 0) {
      this.layersFacade.loadAll();
    }
    this.facade.openEditModal(item);
  }

  onSortFilterChange(val: string) {
    this.facade.patchFilters({ sortBy: val as never });
  }

  onLocationChange(id: string) {
    this.form.patchValue({ locationId: id, greenhouseId: '', zoneId: '', systemId: '', layerId: '' });
  }

  onGreenhouseChange(id: string) {
    this.form.patchValue({ greenhouseId: id, zoneId: '', systemId: '', layerId: '' });
  }

  onZoneChange(id: string) {
    this.form.patchValue({ zoneId: id, systemId: '', layerId: '' });
  }

  onSystemChange(id: string) {
    this.form.patchValue({ systemId: id, layerId: '' });
  }

  setStatus(val: string) {
    this.form.patchValue({ status: val as "active" | "inactive" });
  }

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();
    const editing = this.facade.editingItem();
    const layer = this.layersFacade.selectItems().find(l => l.id === val.layerId);
    const payload = { ...val, layerName: layer?.name ?? '' };
    if (editing) {
      this.facade.update(editing.id, payload);
    } else {
      this.facade.create(payload);
    }
  }

  canDelete(_id: string): boolean {
    return true;
  }

  statusVariant(status: string): string {
    return status === 'active' ? 'active' : 'inactive';
  }

  protected utilizationPct(
    row: { occupiedCapacity: number; totalCapacity?: number; capacity?: number }
  ): number {
    const max = row.totalCapacity ?? row.capacity ?? 0;
    if (max === 0) return 0;
    return Math.round((row.occupiedCapacity / max) * 100);
  }
}






