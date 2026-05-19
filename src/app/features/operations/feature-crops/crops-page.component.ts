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
  CROP_SORT_OPTIONS,
  CreateCropDto,
  CropSortKey,
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
  readonly #defaultForm = { name: '', growthDuration: null as number | null };

  protected readonly form = this.#fb.group({
    name: ['', [Validators.required]],
    growthDuration: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  // --- CONFIG ---
  protected readonly sortOptions = computed(() =>
    CROP_SORT_OPTIONS.map(opt => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    }))
  );

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          growthDuration: item.growthDuration,
        }),
      defaultValue: () => ({ ...this.#defaultForm }),
    });
  }

  ngOnInit(): void {
    this.facade.loadAll();
  }

  // --- ACTIONS ---

  /** Updates sort filter; empty / «الكل» sends no `SetOrder` to CropType fetch. */
  protected updateSortFilter(sort: string): void {
    const sortBy = sort && sort !== 'all' ? (sort as CropSortKey) : 'all';
    this.facade.patchFilters({ sortBy });
  }

  /** Tracks items by unique ID for efficient DOM rendering */
  protected readonly trackById = trackByEntityId;

  /** Handles form submission for both Create and Update flows */
  protected submitForm(): void {
    if (this.form.invalid) return;

    const dto = this.form.getRawValue() as CreateCropDto;
    const editing = this.facade.editingItem();

    if (editing) {
      this.facade.update(editing.id, dto);
    } else {
      this.facade.create(dto);
    }
  }
}






