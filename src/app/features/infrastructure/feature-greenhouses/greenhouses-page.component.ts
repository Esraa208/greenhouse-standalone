import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
  computed,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { GreenhousesFacade, LocationsFacade, type GreenhouseRow } from '@app/core/data-access/infrastructure';
import { GhCrudPageShellComponent, GhEntityListSectionComponent } from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS } from '@app/shared/page-imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-greenhouses-page',
  standalone: true,
  imports: [
    GhCrudPageShellComponent,
    GhEntityListSectionComponent,
    ...CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS,
  ],
  templateUrl: './greenhouses-page.component.html',
  styleUrl: './greenhouses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreenhousesPageComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly facade = inject(GreenhousesFacade);
  readonly locationsFacade = inject(LocationsFacade);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly sortOptions = computed(() => [
    { value: 'all', label: this.i18n.t('common.all') },
    { value: 'name-asc', label: this.i18n.t('sort.name_asc') },
    { value: 'name-desc', label: this.i18n.t('sort.name_desc') },
    { value: 'date-newest', label: this.i18n.t('sort.date_newest') },
    { value: 'date-oldest', label: this.i18n.t('sort.date_oldest') }
  ]);

  readonly statusOptions = computed(() => [
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') }
  ]);

  readonly trackById = trackByEntityId;

  readonly form = this.#fb.nonNullable.group({
    name: ['', Validators.required],
    locationId: ['', Validators.required],
    status: ['active' as 'active' | 'inactive']
  });

  readonly #defaultFormValue = { name: '', locationId: '', status: 'active' as 'active' | 'inactive' };

  /** Active locations, plus the current row’s location when editing (so `<select>` can show inactive sites). */
  readonly availableLocations = computed(() => {
    const active = this.locationsFacade.selectItems();
    const editing = this.facade.editingItem();
    if (!editing?.locationId) return active;
    const linked = this.locationsFacade.selectItems().find((l) => l.id === editing.locationId);
    if (!linked) return active;
    if (active.some((l) => l.id === linked.id)) return active;
    return [...active, linked];
  });

  readonly filteredItems = this.facade.filteredItems;

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          locationId: item.locationId,
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
  }

  openEditModal(item: GreenhouseRow): void {
    // Lazy-load full locations only when edit fallback is needed.
    if (this.locationsFacade.items().length === 0) {
      this.locationsFacade.loadAll();
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
    const payload = { ...val, locationName: loc?.name ?? '' };
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
    row: {
      occupiedCapacity: number;
      totalCapacity?: number;
      capacity?: number;
      occupancyPct?: number;
    }
  ): number {
    if (row.occupancyPct != null && Number.isFinite(row.occupancyPct)) {
      return Math.min(100, Math.round(row.occupancyPct));
    }
    const max = row.totalCapacity ?? row.capacity ?? 0;
    if (max === 0) return 0;
    return Math.round((row.occupiedCapacity / max) * 100);
  }
}






