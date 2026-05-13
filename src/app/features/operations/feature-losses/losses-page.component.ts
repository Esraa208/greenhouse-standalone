import { Component, ChangeDetectionStrategy, inject, computed, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_NO_DELETE_CONFIRM } from '@app/shared/page-imports';
import { LossesFacade, CreateLossDto } from '@app/core/data-access/operations';

@Component({
  selector: 'gh-losses-page',
  standalone: true,
  imports: [...CRUD_LIST_PAGE_IMPORTS_NO_DELETE_CONFIRM],
  templateUrl: './losses-page.component.html',
  styleUrl: './losses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LossesPageComponent {
  readonly facade = inject(LossesFacade);
  readonly i18n = inject(TranslationService);
  readonly #fb = inject(FormBuilder);

  readonly sourceTypeOptions = computed(() => [
    { value: 'all',        label: this.i18n.t('filter.all')        },
    { value: 'allocation', label: this.i18n.t('losses.src_alloc')  },
    { value: 'layer',      label: this.i18n.t('losses.src_layer')  },
    { value: 'batch',      label: this.i18n.t('losses.src_batch')  },
  ]);

  readonly lossTypeOptions = computed(() => [
    { value: 'all',     label: this.i18n.t('filter.all')           },
    { value: 'disease', label: this.i18n.t('losses.type_disease')  },
    { value: 'pest',    label: this.i18n.t('losses.type_pest')     },
    { value: 'weather', label: this.i18n.t('losses.type_weather')  },
    { value: 'other',   label: this.i18n.t('losses.type_other')    },
  ]);

  readonly today = new Date().toISOString().split('T')[0];

  readonly lossForm = this.#fb.nonNullable.group({
    mode:         ['infrastructure' as 'infrastructure' | 'batch'],
    lossType:     ['', Validators.required],
    date:         [this.today, Validators.required],
    reason:       ['', Validators.required],
    quantity:     [null as number | null],
    batchId:      [''],
    notes:        [''],
  });

  constructor() {
    this.facade.loadAll();

    effect(() => {
      const open = this.facade.isModalOpen();
      if (!open) {
        this.lossForm.reset({
          mode: 'infrastructure',
          date: new Date().toISOString().split('T')[0],
        });
      }
    });
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;

  protected submitLoss(): void {
    if (this.lossForm.invalid) return;
    const val = this.lossForm.getRawValue();
    this.facade.create({
      ...val,
      lossType: val.lossType as any,
    } as CreateLossDto);
  }

  protected onModeChange(mode: string): void {
    const typedMode = mode as 'infrastructure' | 'batch';
    this.facade.setModalMode(typedMode);
    this.lossForm.controls.mode.setValue(typedMode);
  }
}






