import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { LocationsFacade } from '@app/core/data-access/infrastructure';
import { GhCrudPageShellComponent, GhEntityListSectionComponent } from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from '@app/shared/page-imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-locations-page',
  standalone: true,
  imports: [GhCrudPageShellComponent, GhEntityListSectionComponent, ...CRUD_LIST_PAGE_IMPORTS_STANDARD],
  templateUrl: './locations-page.component.html',
  styleUrl: './locations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationsPageComponent implements OnInit {
  readonly i18n = inject(TranslationService);
  readonly facade = inject(LocationsFacade);
  readonly #fb = inject(FormBuilder);

  readonly sortOptions = computed(() => [
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
    name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    status: ['active' as 'active' | 'inactive']
  });

  readonly #defaultFormValue = { name: '', address: '', status: 'active' as 'active' | 'inactive' };

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          address: item.address,
          status: item.status as 'active' | 'inactive',
        }),
      defaultValue: () => ({ ...this.#defaultFormValue }),
    });
  }

  ngOnInit(): void {
    this.facade.enterPage();
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
    if (editing) {
      this.facade.update(editing.id, val);
    } else {
      this.facade.create(val);
    }
  }

  canDelete(_id: string): boolean {
    return true; // Simple stub if needed, replaced old facade check
  }

  statusVariant(status: string): string {
    return status === 'active' ? 'active' : 'inactive';
  }
}






