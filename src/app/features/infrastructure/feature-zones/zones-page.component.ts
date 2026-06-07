import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { ZonesFacade, LocationsFacade, GreenhousesFacade, type ZoneRow } from '@app/core/data-access/infrastructure';
import { GhCrudPageShellComponent, GhEntityListSectionComponent } from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS } from '@app/shared/page-imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';
import { modalCascadeOptions, withEditFallback } from '../infrastructure-cascade.helper';

@Component({
  selector: 'gh-zones-page',
  standalone: true,
  imports: [
    GhCrudPageShellComponent,
    GhEntityListSectionComponent,
    ...CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS,
  ],
  templateUrl: './zones-page.component.html',
  styleUrl: './zones-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesPageComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly facade = inject(ZonesFacade);
  readonly locationsFacade = inject(LocationsFacade);
  readonly greenhousesFacade = inject(GreenhousesFacade);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly sortOptions = computed(() => [
    { value: 'name-asc', label: this.i18n.t('sort.name_asc') },
    { value: 'name-desc', label: this.i18n.t('sort.name_desc') },
    { value: 'date-newest', label: this.i18n.t('sort.date_newest') },
    { value: 'date-oldest', label: this.i18n.t('sort.date_oldest') },
  ]);

  readonly statusOptions = computed(() => [
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') }
  ]);

  readonly trackById = trackByEntityId;

  readonly form = this.#fb.nonNullable.group({
    name: ['', Validators.required],
    locationId: ['', Validators.required],
    greenhouseId: ['', Validators.required],
    status: ['active' as 'active' | 'inactive']
  });

  readonly #defaultFormValue = { name: '', locationId: '', greenhouseId: '', status: 'active' as 'active' | 'inactive' };

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
  readonly filteredItems = this.facade.filteredItems;

  /** Greenhouses available in the table filter row (filtered by selected location) */
  readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    if (locId === 'all') return this.greenhousesFacade.selectItems();
    return this.greenhousesFacade.selectForLocation();
  });

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) => {
        const gh = this.greenhousesFacade.selectItems().find((g) => g.id === item.greenhouseId);
        const locationId = item.locationId || gh?.locationId || '';
        this.form.patchValue({
          name: item.name,
          locationId,
          greenhouseId: item.greenhouseId,
          status: item.status as 'active' | 'inactive',
        });
        this.greenhousesFacade.loadActiveForLocation(locationId);
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
  }

  onLocationChange(id: string) {
    this.form.patchValue({ locationId: id, greenhouseId: '' });
    this.greenhousesFacade.loadActiveForLocation(id);
  }

  onFilterLocationChange(val: string) {
    this.facade.patchFilters({ locationId: val as never, greenhouseId: 'all' });
    this.greenhousesFacade.loadActiveForLocation(val === 'all' ? '' : val);
  }

  openEditModal(item: ZoneRow): void {
    // Lazy-load full parent lists only when needed for editing inactive-linked parents.
    if (this.locationsFacade.items().length === 0) {
      this.locationsFacade.loadAll();
    }
    if (this.greenhousesFacade.items().length === 0) {
      this.greenhousesFacade.loadAll();
    }
    this.facade.openEditModal(item);
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
    const loc = this.locationsFacade.selectItems().find(l => l.id === val.locationId);
    const gh = this.greenhousesFacade.selectItems().find(g => g.id === val.greenhouseId);
    const payload = { ...val, locationName: loc?.name ?? '', greenhouseName: gh?.name ?? '' };
    if (editing) {
      this.facade.update(editing.id, payload);
    } else {
      this.facade.create(payload);
    }
  }

  canDelete(_id: string): boolean {
    return true; 
  }

  /** Maps entity status to a badge variant string. Returns string (not BadgeVariant) so
   *  template bindings work regardless of Language Service cache state. */
  statusVariant(status: string): string {
    return status === 'active' ? 'active' : 'inactive';
  }

  protected utilizationPct(row: ZoneRow): number {
    if (row.occupancyPct != null && Number.isFinite(row.occupancyPct)) {
      return Math.min(100, row.occupancyPct);
    }
    if (row.totalCapacity === 0) return 0;
    return (row.occupiedCapacity / row.totalCapacity) * 100;
  }
}






