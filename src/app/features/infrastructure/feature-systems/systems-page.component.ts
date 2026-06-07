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
import { modalCascadeOptions, withEditFallback } from '../infrastructure-cascade.helper';

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
    { value: 'date-newest', label: this.i18n.t('sort.date_newest') },
    { value: 'date-oldest', label: this.i18n.t('sort.date_oldest') },
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

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) => {
        this.form.patchValue({
          name: item.name,
          type: item.type,
          locationId: item.locationId,
          greenhouseId: item.greenhouseId,
          zoneId: item.zoneId,
          status: item.status as 'active' | 'inactive',
        });
        this.greenhousesFacade.loadActiveForLocation(item.locationId);
        this.zonesFacade.loadActiveForUnit(item.greenhouseId);
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
    this.greenhousesFacade.loadActiveForLocation(id);
    this.zonesFacade.loadActiveForUnit('');
  }

  onGreenhouseChange(id: string) {
    this.form.patchValue({ greenhouseId: id, zoneId: '' });
    this.zonesFacade.loadActiveForUnit(id);
  }

  onFilterLocationChange(val: string) {
    this.facade.patchFilters({ locationId: val as never, greenhouseId: 'all', zoneId: 'all' });
    this.greenhousesFacade.loadActiveForLocation(val === 'all' ? '' : val);
    this.zonesFacade.loadActiveForUnit('');
    this.zonesFacade.loadActiveForLocation(val === 'all' ? '' : val);
  }

  onFilterGreenhouseChange(val: string) {
    this.facade.patchFilters({ greenhouseId: val as never, zoneId: 'all' });
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
    const zone =
      this.zonesFacade.selectForUnit().find((z) => z.id === val.zoneId) ??
      this.zonesFacade.selectItems().find((z) => z.id === val.zoneId);
    const gh =
      this.greenhousesFacade.selectForLocation().find((g) => g.id === val.greenhouseId) ??
      this.greenhousesFacade.selectItems().find((g) => g.id === val.greenhouseId);
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

  protected utilizationPct(row: SystemRow): number {
    if (row.occupancyPct != null && Number.isFinite(row.occupancyPct)) {
      return Math.min(100, row.occupancyPct);
    }
    if (row.totalCapacity === 0) return 0;
    return (row.occupiedCapacity / row.totalCapacity) * 100;
  }
}






