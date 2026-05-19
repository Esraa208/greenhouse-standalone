import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@app/shared/pipes';
import { GhFormGroupComponent } from '../ui';
import type {
  LossRegistrationBatch,
  LossRegistrationLayer,
} from '@app/core/data-access/operations/models/loss-registration.model';
import type { LossRefBatch } from '@app/core/data-access/operations/models/loss.model';

@Component({
  selector: 'gh-batch-loss-registration-panel',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    GhFormGroupComponent,
  ],
  templateUrl: './batch-loss-registration-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchLossRegistrationPanelComponent {
  readonly batchSummary = input<LossRegistrationBatch | null>(null);
  readonly layers = input<readonly LossRegistrationLayer[]>([]);
  readonly loading = input(false);
  readonly wholeBatch = input(false);
  readonly expandedLayerIds = input<readonly string[]>([]);
  readonly selectedAllocationIds = input<readonly string[]>([]);
  readonly selectedQuantityMax = input(0);
  readonly showBatchSelect = input(false);
  readonly batches = input<readonly LossRefBatch[]>([]);
  readonly selectedBatchId = input('');
  readonly form = input.required<FormGroup>();

  readonly batchIdChange = output<string>();
  readonly wholeBatchChange = output<boolean>();
  readonly layerExpandedToggle = output<string>();
  readonly layerCheckChange = output<{ layerId: string; checked: boolean }>();
  readonly allocationCheckChange = output<{ allocationId: string; checked: boolean }>();
  readonly selectAllClick = output<void>();

  protected readonly selectedIdSet = computed(
    () => new Set(this.selectedAllocationIds()),
  );

  protected readonly expandedSet = computed(
    () => new Set(this.expandedLayerIds()),
  );

  protected isExpanded(layerId: string): boolean {
    return this.expandedSet().has(layerId);
  }

  protected isLayerChecked(layer: LossRegistrationLayer): boolean {
    if (layer.allocations.length === 0) return false;
    const ids = this.selectedIdSet();
    return layer.allocations.every((a) => ids.has(a.id));
  }

  protected isAllocationChecked(allocationId: string): boolean {
    return this.selectedIdSet().has(allocationId);
  }

  protected layerTitle(layer: LossRegistrationLayer): string {
    if (layer.layerPosition > 0) {
      return String(layer.layerPosition);
    }
    return layer.name;
  }

  protected useLayerNumberKey(layer: LossRegistrationLayer): boolean {
    return layer.layerPosition > 0;
  }

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected stopCheckbox(event: Event): void {
    event.stopPropagation();
  }
}
