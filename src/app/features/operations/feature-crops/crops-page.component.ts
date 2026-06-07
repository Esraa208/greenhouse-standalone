/* libs/operations/feature-crops/src/lib/crops-page.component.ts */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BreakpointService, TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from '@app/shared/page-imports';
import {
  CropsFacade,
  CreateCropDto,
  UpdateCropDto,
} from '@app/core/data-access/operations';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-crops-page',
  standalone: true,
  imports: [DecimalPipe, ...CRUD_LIST_PAGE_IMPORTS_STANDARD],
  templateUrl: './crops-page.component.html',
  styleUrl: './crops-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropsPageComponent implements OnInit {
  // --- INJECTION ---
  protected readonly facade = inject(CropsFacade);
  protected readonly i18n = inject(TranslationService);
  protected readonly breakpoint = inject(BreakpointService);
  readonly #fb = inject(FormBuilder).nonNullable;

  // --- FORM ---
  readonly #defaultForm = {
    name: '',
    growthDuration: null as number | null,
    status: 'active' as 'active' | 'inactive',
  };

  protected readonly form = this.#fb.group({
    name: ['', [Validators.required]],
    growthDuration: [null as number | null, [Validators.required, Validators.min(1)]],
    status: ['active' as 'active' | 'inactive'],
  });

  // --- CONFIG ---
  protected readonly sortOptions = computed(() => [
    { value: 'name-asc', label: this.i18n.t('sort.name_asc') },
    { value: 'name-desc', label: this.i18n.t('sort.name_desc') },
    { value: 'date-newest', label: this.i18n.t('sort.date_newest') },
    { value: 'date-oldest', label: this.i18n.t('sort.date_oldest') },
  ]);

  protected readonly statusOptions = computed(() => [
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') },
  ]);

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          growthDuration: item.growthDuration,
          status: item.status,
        }),
      defaultValue: () => ({ ...this.#defaultForm }),
    });
  }

  ngOnInit(): void {
    this.facade.loadAll();
  }

  // --- ACTIONS ---

  protected onSortFilterChange(val: string): void {
    this.facade.patchFilters({ sortBy: val as never });
  }

  protected onStatusFilterChange(status: string): void {
    this.facade.patchFilters({ status: status as 'all' | 'active' | 'inactive' });
  }

  protected statusVariant(status: string): string {
    return status === 'active' ? 'active' : 'inactive';
  }

  protected statusLabel(status: string): string {
    return status === 'active'
      ? this.i18n.t('common.active')
      : this.i18n.t('common.inactive');
  }

  protected setStatus(val: string): void {
    this.form.patchValue({ status: val as 'active' | 'inactive' });
  }

  /** Tracks items by unique ID for efficient DOM rendering */
  protected readonly trackById = trackByEntityId;

  /** Handles form submission for both Create and Update flows */
  protected submitForm(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const editing = this.facade.editingItem();

    if (editing) {
      const dto: UpdateCropDto = {
        name: val.name,
        growthDuration: val.growthDuration!,
        status: val.status,
      };
      this.facade.update(editing.id, dto);
    } else {
      this.facade.create({
        name: val.name,
        growthDuration: val.growthDuration!,
      });
    }
  }
}






