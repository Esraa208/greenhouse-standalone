import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import {
  SystemsFacade,
  ZonesFacade,
  GreenhousesFacade,
  LocationsFacade,
  type SystemRow,
} from '@app/core/data-access/infrastructure';
import { INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS } from '../infrastructure-crud.imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-systems-page',
  standalone: true,
  imports: [...INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS],
  templateUrl: './systems-page.component.html',
  styleUrl: './systems-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemsPageComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly facade = inject(SystemsFacade);
  readonly locationsFacade = inject(LocationsFacade);
  readonly greenhousesFacade = inject(GreenhousesFacade);
  readonly zonesFacade = inject(ZonesFacade);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly sortOptions = computed(() => [
    { value: 'name-asc', label: this.i18n.t('sort.name_asc') },
    { value: 'name-desc', label: this.i18n.t('sort.name_desc') },
    { value: 'zone-asc', label: this.i18n.t('sort.zone_asc') },
    { value: 'capacity-desc', label: this.i18n.t('sort.capacity_desc') },
    { value: 'utilization-desc', label: this.i18n.t('sort.utilization_desc') }
  ]);

  readonly systemTypeOptions = computed(() => [
    { value: 'NFT', label: this.i18n.t('systems.type_nft') },
    { value: 'DWC', label: this.i18n.t('systems.type_dwc') },
  ]);

  readonly statusOptions = computed(() => [
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') }
  ]);

  readonly trackById = trackByEntityId;

  readonly form = this.#fb.nonNullable.group({
    name:         ['', Validators.required],
    type:         ['NFT', Validators.required],
    locationId:   ['', Validators.required],
    greenhouseId: ['', Validators.required],
    zoneId:       ['', Validators.required],
    status:       ['active' as 'active' | 'inactive'],
  });

  readonly #defaultFormValue = {
    name: '', type: 'NFT', locationId: '', greenhouseId: '', zoneId: '',
    status: 'active' as 'active' | 'inactive',
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
       return src.filter(z => z.locationId === locId);
    }
    return src.filter(z => z.greenhouseId === ghId);
  });

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          type: item.type,
          locationId: item.locationId,
          greenhouseId: item.greenhouseId,
          zoneId: item.zoneId,
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
  }

  openEditModal(item: SystemRow): void {
    if (this.locationsFacade.items().length === 0) {
      this.locationsFacade.loadAll();
    }
    if (this.greenhousesFacade.items().length === 0) {
      this.greenhousesFacade.loadAll();
    }
    if (this.zonesFacade.items().length === 0) {
      this.zonesFacade.loadAll();
    }
    this.facade.openEditModal(item);
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

  onTypeChange(type: string) {
    this.form.patchValue({ type });
  }

  systemTypeLabel(type: string): string {
    const normalized = type?.toUpperCase();
    const match = this.systemTypeOptions().find((opt) => opt.value.toUpperCase() === normalized);
    return match?.label ?? type;
  }

  onLocationChange(id: string) {
    this.form.patchValue({ locationId: id, greenhouseId: '', zoneId: '' });
  }

  onGreenhouseChange(id: string) {
    this.form.patchValue({ greenhouseId: id, zoneId: '' });
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
    const zone = this.zonesFacade.selectItems().find(z => z.id === val.zoneId);
    const gh = this.greenhousesFacade.selectItems().find(g => g.id === val.greenhouseId);
    const loc = this.locationsFacade.selectItems().find(l => l.id === val.locationId);
    const payload = {
      ...val,
      zoneName: zone?.name ?? '',
      greenhouseName: gh?.name ?? '',
      locationName: loc?.name ?? '',
    };
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






