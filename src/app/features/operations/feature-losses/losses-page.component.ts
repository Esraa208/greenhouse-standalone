import { Component, ChangeDetectionStrategy, inject, computed, effect, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_NO_DELETE_CONFIRM } from '@app/shared/page-imports';
import {
  LossesFacade,
  BatchLossRegistrationFacade,
  type BatchLossFormValues,
  type LossType,
} from '@app/core/data-access/operations';
import { BatchLossRegistrationPanelComponent } from '@app/shared/components';

@Component({
  selector: 'gh-losses-page',
  standalone: true,
  imports: [...CRUD_LIST_PAGE_IMPORTS_NO_DELETE_CONFIRM, BatchLossRegistrationPanelComponent],
  templateUrl: './losses-page.component.html',
  styleUrl: './losses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LossesPageComponent implements OnInit {
  readonly facade = inject(LossesFacade);
  readonly regFacade = inject(BatchLossRegistrationFacade);
  readonly i18n = inject(TranslationService);
  readonly #fb = inject(FormBuilder);

  readonly sourceTypeOptions = computed(() => [
    { value: 'all', label: this.i18n.t('common.all') },
    { value: 'allocation', label: this.i18n.t('losses.src_alloc') },
    { value: 'layer', label: this.i18n.t('losses.src_layer') },
    { value: 'batch', label: this.i18n.t('losses.src_batch') },
  ]);

  readonly lossTypeOptions = computed(() => [
    { value: 'all', label: this.i18n.t('common.all') },
    { value: 'disease', label: this.i18n.t('losses.type_disease') },
    { value: 'pest', label: this.i18n.t('losses.type_pest') },
    { value: 'weather', label: this.i18n.t('losses.type_weather') },
    { value: 'other', label: this.i18n.t('losses.type_other') },
  ]);

  readonly today = new Date().toISOString().split('T')[0];

  readonly lossForm = this.#fb.nonNullable.group({
    lossType: ['', Validators.required],
    date: [this.today, Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
    notes: [''],
  });

  readonly canSubmitLoss = computed(() => {
    const qty = this.lossForm.controls.quantity.value;
    const max = this.regFacade.selectedQuantityMax();
    return (
      this.lossForm.valid &&
      this.regFacade.hasSelection() &&
      !!this.regFacade.selectedBatchId() &&
      qty != null &&
      qty > 0 &&
      (max <= 0 || qty <= max)
    );
  });

  constructor() {
    effect(() => {
      if (!this.regFacade.isOpen()) {
        this.lossForm.reset({
          lossType: '',
          date: new Date().toISOString().split('T')[0],
          quantity: null,
          reason: '',
          notes: '',
        });
      }
    });
  }

  ngOnInit(): void {
    this.facade.enterPage();
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;

  protected openRegisterModal(): void {
    this.regFacade.openModal();
  }

  protected submitBatchLoss(): void {
    if (!this.canSubmitLoss()) return;
    const val = this.lossForm.getRawValue();
    this.regFacade.submit({
      lossType: val.lossType as LossType,
      date: val.date,
      quantity: val.quantity ?? 0,
      reason: val.reason,
      notes: val.notes,
    } satisfies BatchLossFormValues);
  }
}
