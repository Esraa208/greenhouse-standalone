import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { ZonesFacade, LocationsFacade, GreenhousesFacade, type ZoneRow } from '@app/core/data-access/infrastructure';
import { GhCrudPageShellComponent, GhEntityListSectionComponent } from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS } from '@app/shared/page-imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

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
    { value: 'greenhouse-asc', label: this.i18n.t('sort.greenhouse_asc') },
    { value: 'capacity-desc', label: this.i18n.t('sort.capacity_desc') },
    { value: 'systems-desc', label: this.i18n.t('sort.systems_desc') }
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
  readonly filteredItems = this.facade.filteredItems;

  /** Greenhouses available in the table filter row (filtered by selected location) */
  readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    const src = this.greenhousesFacade.selectItems();
    if (locId === 'all') return src;
    return src.filter((gh) => gh.locationId === locId);
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
    this.form.patchValue({ locationId: id, greenhouseId: '' });
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

  protected utilizationPct(
    row: { occupiedCapacity: number; totalCapacity?: number; capacity?: number }
  ): number {
    const max = row.totalCapacity ?? row.capacity ?? 0;
    if (max === 0) return 0;
    return Math.round((row.occupiedCapacity / max) * 100);
  }
}






