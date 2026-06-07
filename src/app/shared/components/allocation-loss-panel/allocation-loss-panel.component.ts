import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@app/shared/pipes';
import { TranslationService } from '@app/core';
import { GhFormGroupComponent, InputComponent } from '../ui';
import type { AllocationRow } from '@app/core/data-access/operations/models/allocation.model';

@Component({
  selector: 'gh-allocation-loss-panel',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    GhFormGroupComponent,
    InputComponent,
  ],
  templateUrl: './allocation-loss-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllocationLossPanelComponent {
  readonly #i18n = inject(TranslationService);

  readonly item = input.required<AllocationRow>();
  readonly form = input.required<FormGroup>();

  protected readonly layerTitle = computed(() => {
    const row = this.item();
    const layer = row.layer.trim();
    if (layer) return layer;
    if (row.layerPosition > 0) {
      return this.#i18n.t('allocations.layer_number', { count: String(row.layerPosition) });
    }
    return row.pipe.trim() || '—';
  });
}
