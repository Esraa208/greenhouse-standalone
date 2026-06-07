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
import { modalCascadeOptions, withEditFallback } from '../infrastructure-cascade.helper';

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
    return withEditFallback(
      this.locationsFacade.selectItems(),
      this.locationsFacade.selectItems(),
      editing?.locationId
    );
  });

  readonly availableGreenhouses = computed(() => {
    const editing = this.facade.editingItem();
    const locId = this.formValue().locationId || editing?.locationId || '';
    return modalCascadeOptions(
      locId,
      this.greenhousesFacade.selectForLocation(),
      this.greenhousesFacade.selectItems(),
      this.formValue().greenhouseId,
      editing ? { parentId: editing.locationId, childId: editing.greenhouseId } : null
    );
  });

  readonly availableZones = computed(() => {
    const editing = this.facade.editingItem();
    const ghId = this.formValue().greenhouseId || editing?.greenhouseId || '';
    return modalCascadeOptions(
      ghId,
      this.zonesFacade.selectForUnit(),
      this.zonesFacade.selectItems(),
      this.formValue().zoneId,
      editing ? { parentId: editing.greenhouseId, childId: editing.zoneId } : null
    );
  });

  readonly availableSystems = computed(() => {
    const editing = this.facade.editingItem();
    const zoneId = this.formValue().zoneId || editing?.zoneId || '';
    return modalCascadeOptions(
      zoneId,
      this.systemsFacade.selectForZone(),
      this.systemsFacade.selectItems(),
      this.formValue().systemId,
      editing ? { parentId: editing.zoneId, childId: editing.systemId } : null
    );
  });

  readonly availableLayers = computed(() => {
    const editing = this.facade.editingItem();
    const sysId = this.formValue().systemId || editing?.systemId || '';
    return modalCascadeOptions(
      sysId,
      this.layersFacade.selectForSystem(),
      this.layersFacade.selectItems(),
      this.formValue().layerId,
      editing ? { parentId: editing.systemId, childId: editing.layerId } : null
    );
  });

  readonly filteredItems = this.facade.filteredItems;

  readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    if (locId === 'all') return this.greenhousesFacade.selectItems();
    return this.greenhousesFacade.selectForLocation();
  });

  readonly filterZones = computed(() => {
    const ghId = this.facade.filters().greenhouseId;
    const locId = this.facade.filters().locationId;
    if (ghId !== 'all') return this.zonesFacade.selectForUnit();
    if (locId !== 'all') return this.zonesFacade.selectForLocation();
    return this.zonesFacade.selectItems();
  });

  readonly filterSystems = computed(() => {
    const zoneId = this.facade.filters().zoneId;
    if (zoneId !== 'all') return this.systemsFacade.selectForZone();
    return this.systemsFacade.selectItems();
  });

  readonly filterLayers = computed(() => {
    const sysId = this.facade.filters().systemId;
    if (sysId !== 'all') return this.layersFacade.selectForSystem();
    return this.layersFacade.selectItems();
  });

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) => {
        this.form.patchValue({
          name: item.name,
          locationId: item.locationId,
          greenhouseId: item.greenhouseId,
          zoneId: item.zoneId,
          systemId: item.systemId,
          layerId: item.layerId,
          capacity: item.capacity,
          status: item.status as 'active' | 'inactive',
        });
        this.greenhousesFacade.loadActiveForLocation(item.locationId);
        this.zonesFacade.loadActiveForUnit(item.greenhouseId);
        this.systemsFacade.loadActiveForZone(item.zoneId);
        this.layersFacade.loadActiveForSystem(item.systemId);
      },
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
    this.greenhousesFacade.loadActiveForLocation(id);
    this.zonesFacade.loadActiveForUnit('');
    this.systemsFacade.loadActiveForZone('');
    this.layersFacade.loadActiveForSystem('');
  }

  onGreenhouseChange(id: string) {
    this.form.patchValue({ greenhouseId: id, zoneId: '', systemId: '', layerId: '' });
    this.zonesFacade.loadActiveForUnit(id);
    this.systemsFacade.loadActiveForZone('');
    this.layersFacade.loadActiveForSystem('');
  }

  onFilterLocationChange(val: string) {
    this.facade.patchFilters({
      locationId: val as never,
      greenhouseId: 'all',
      zoneId: 'all',
      systemId: 'all',
      layerId: 'all',
    });
    this.greenhousesFacade.loadActiveForLocation(val === 'all' ? '' : val);
    this.zonesFacade.loadActiveForUnit('');
    this.zonesFacade.loadActiveForLocation(val === 'all' ? '' : val);
    this.systemsFacade.loadActiveForZone('');
    this.layersFacade.loadActiveForSystem('');
  }

  onFilterGreenhouseChange(val: string) {
    this.facade.patchFilters({ greenhouseId: val as never, zoneId: 'all', systemId: 'all', layerId: 'all' });
    if (val === 'all') {
      this.zonesFacade.loadActiveForUnit('');
      const locId = this.facade.filters().locationId;
      if (locId !== 'all') {
        this.zonesFacade.loadActiveForLocation(locId);
      }
    } else {
      this.zonesFacade.loadActiveForLocation('');
      this.zonesFacade.loadActiveForUnit(val);
    }
    this.systemsFacade.loadActiveForZone('');
    this.layersFacade.loadActiveForSystem('');
  }

  onFilterZoneChange(val: string) {
    this.facade.patchFilters({ zoneId: val as never, systemId: 'all', layerId: 'all' });
    this.systemsFacade.loadActiveForZone(val === 'all' ? '' : val);
    this.layersFacade.loadActiveForSystem('');
  }

  onFilterSystemChange(val: string) {
    this.facade.patchFilters({ systemId: val as never, layerId: 'all' });
    this.layersFacade.loadActiveForSystem(val === 'all' ? '' : val);
  }

  onZoneChange(id: string) {
    this.form.patchValue({ zoneId: id, systemId: '', layerId: '' });
    this.systemsFacade.loadActiveForZone(id);
    this.layersFacade.loadActiveForSystem('');
  }

  onSystemChange(id: string) {
    this.form.patchValue({ systemId: id, layerId: '' });
    this.layersFacade.loadActiveForSystem(id);
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
    const layer =
      this.layersFacade.selectForSystem().find((l) => l.id === val.layerId) ??
      this.layersFacade.selectItems().find((l) => l.id === val.layerId);
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






