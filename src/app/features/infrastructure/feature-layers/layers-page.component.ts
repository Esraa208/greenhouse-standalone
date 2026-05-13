import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import {
  LayersFacade,
  SystemsFacade,
  ZonesFacade,
  GreenhousesFacade,
  LocationsFacade,
  type LayerRow,
} from '@app/core/data-access/infrastructure';
import { INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS } from '../infrastructure-crud.imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-layers-page',
  standalone: true,
  imports: [...INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS],
  templateUrl: './layers-page.component.html',
  styleUrl: './layers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersPageComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly facade = inject(LayersFacade);
  readonly systemsFacade = inject(SystemsFacade);
  readonly zonesFacade = inject(ZonesFacade);
  readonly greenhousesFacade = inject(GreenhousesFacade);
  readonly locationsFacade = inject(LocationsFacade);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly sortOptions = computed(() => [
    { value: 'name-asc', label: this.i18n.t('sort.name_asc') },
    { value: 'name-desc', label: this.i18n.t('sort.name_desc') },
    { value: 'system-asc', label: this.i18n.t('sort.system_asc') },
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
    systemId: ['', [Validators.required]],
    position: [1, [Validators.required]],
    totalCapacity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    status: ['active' as 'active' | 'inactive']
  });

  readonly #defaultFormValue = {
    name: '', locationId: '', greenhouseId: '', zoneId: '', systemId: '',
    position: 1, totalCapacity: 0, status: 'active' as 'active' | 'inactive'
  };

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Filter bar + modal dropdowns: active-only from API (`selectItems`), with inactive parent merged when editing (`items`). */
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

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item: LayerRow) =>
        this.form.patchValue({
          name: item.name,
          locationId: item.locationId,
          greenhouseId: item.greenhouseId,
          zoneId: item.zoneId,
          systemId: item.systemId,
          position: item.position,
          totalCapacity: item.totalCapacity,
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

  onLocationChange(id: string) {
    this.form.patchValue({ locationId: id, greenhouseId: '', zoneId: '', systemId: '' });
  }

  openEditModal(item: LayerRow): void {
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
    this.facade.openEditModal(item);
  }

  onGreenhouseChange(id: string) {
    this.form.patchValue({ greenhouseId: id, zoneId: '', systemId: '' });
  }

  onZoneChange(id: string) {
    this.form.patchValue({ zoneId: id, systemId: '' });
  }

  onStatusFilterChange(val: string) {
    this.facade.patchFilters({ status: val as never });
  }

  onSortFilterChange(val: string) {
    this.facade.patchFilters({ sortBy: val as never });
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
    const sys = this.systemsFacade.selectItems().find(s => s.id === val.systemId);
    const payload = { ...val, systemName: sys?.name ?? '' };
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






