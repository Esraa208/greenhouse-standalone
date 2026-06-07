import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@app/shared/pipes';
import { PositiveIntInputDirective } from '@app/shared/directives';
import type { AllocationRow } from '@app/core/data-access/operations/models/allocation.model';

export interface TransferSelectOption {
  readonly id: string;
  readonly name: string;
}

@Component({
  selector: 'gh-transfer-allocation-panel',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, PositiveIntInputDirective],
  templateUrl: './transfer-allocation-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferAllocationPanelComponent {
  readonly item = input.required<AllocationRow>();
  readonly quantity = input.required<number>();
  readonly maxQuantity = input.required<number>();

  readonly locationId = input('');
  readonly greenhouseId = input('');
  readonly zoneId = input('');
  readonly systemId = input('');
  readonly layerId = input('');

  readonly locations = input<readonly TransferSelectOption[]>([]);
  readonly greenhouses = input<readonly TransferSelectOption[]>([]);
  readonly zones = input<readonly TransferSelectOption[]>([]);
  readonly systems = input<readonly TransferSelectOption[]>([]);
  readonly layers = input<readonly TransferSelectOption[]>([]);
  readonly pathSegments = input<readonly string[]>([]);

  readonly locationIdChange = output<string>();
  readonly greenhouseIdChange = output<string>();
  readonly zoneIdChange = output<string>();
  readonly systemIdChange = output<string>();
  readonly layerIdChange = output<string>();
  readonly quantityChange = output<number>();
  readonly quantityPctChange = output<number>();

  protected readonly pctPresets: readonly { fraction: number; labelKey: string }[] = [
    { fraction: 0.25, labelKey: 'allocations.move_pct_25' },
    { fraction: 0.5, labelKey: 'allocations.move_pct_50' },
    { fraction: 0.75, labelKey: 'allocations.move_pct_75' },
    { fraction: 1, labelKey: 'allocations.move_pct_all' },
  ];

  protected readonly showPathPreview = computed(() => this.pathSegments().length > 0);

  protected readonly activePctFraction = computed(() => {
    const max = this.maxQuantity();
    const qty = this.quantity();
    if (max <= 0 || qty <= 0) return null;
    for (const { fraction } of this.pctPresets) {
      const expected = fraction >= 1 ? max : Math.max(1, Math.floor(max * fraction));
      if (qty === expected) return fraction;
    }
    return null;
  });

  protected readonly quantityExceeded = computed(
    () => this.quantity() > this.maxQuantity(),
  );

  protected readonly showQuantityStatus = computed(
    () => this.quantity() > 0 && !this.quantityExceeded(),
  );

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected inputNumber(event: Event): number {
    const raw = (event.target as HTMLInputElement).value;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  protected isPctActive(fraction: number): boolean {
    return this.activePctFraction() === fraction;
  }
}
