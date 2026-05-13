import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_FORM_MODAL } from '@app/shared/page-imports';
import { HarvestFacade } from '@app/core/data-access/operations';

@Component({
  selector: 'gh-harvest-page',
  standalone: true,
  imports: [...CRUD_LIST_PAGE_IMPORTS_FORM_MODAL],
  templateUrl: './harvest-page.component.html',
  styleUrl: './harvest-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarvestPageComponent {
  readonly facade = inject(HarvestFacade);
  readonly i18n = inject(TranslationService);
  readonly #fb = inject(FormBuilder);

  readonly harvestForm = this.#fb.nonNullable.group({
    totalWeight:           [null as number | null, [Validators.required, Validators.min(0.01)]],
    hasRoots:              [false],
    rootWeightPerPlant:    [null as number | null],
    pricePerKg:            [null as number | null, [Validators.required, Validators.min(0.01)]],
    customerId:            ['', Validators.required],
    notes:                 [''],
  });

  constructor() {
    this.facade.loadAll();
    
    effect(() => {
      if (!this.facade.isModalOpen()) {
        this.harvestForm.reset({ hasRoots: false });
      }
    });
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;

  protected get computedNetWeight(): number {
    const tw = this.harvestForm.controls.totalWeight.value ?? 0;
    const hr = this.harvestForm.controls.hasRoots.value;
    const rg = this.harvestForm.controls.rootWeightPerPlant.value ?? 0;
    return this.facade.netWeight(tw, hr, rg);
  }

  protected get computedTotalValue(): number {
    const ppk = this.harvestForm.controls.pricePerKg.value ?? 0;
    return this.facade.totalValue(this.computedNetWeight, ppk);
  }

  protected submitHarvest(): void {
    if (this.harvestForm.invalid) return;
    const v = this.harvestForm.getRawValue();
    this.facade.create({
      allocations: [],
      totalWeight:  v.totalWeight ?? 0,
      hasRoots:     v.hasRoots,
      rootWeightPerPlantGrams: v.rootWeightPerPlant ?? undefined,
      pricePerKg:   v.pricePerKg ?? 0,
      customerId:   v.customerId,
      notes:        v.notes || undefined,
    });
  }
}






