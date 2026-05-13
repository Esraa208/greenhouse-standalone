// libs/shared/ui/src/lib/segmented-control/segmented-control.component.ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentOption {
  label: string;
  value: string;
}

@Component({
  selector: 'gh-segmented-control',
  standalone: true,
  templateUrl: './segmented-control.component.html',
  styleUrl: './segmented-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControlComponent {
  readonly options = input<SegmentOption[]>([]);
  readonly value = model<string>('');

  selectOption(val: string): void {
    this.value.set(val);
  }
}





