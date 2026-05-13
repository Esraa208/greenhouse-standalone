// libs/shared/ui/src/lib/progress-bar/progress-bar.component.ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Documented variants — input accepts any string so template ternaries don't need casts. */
export type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gh-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly variant = input<string>('primary');
  readonly size = input<string>('md');
  readonly label = input<string>('');
  readonly showPercentage = input<boolean>(false);


  readonly percentage = computed(() => {
    const max = this.max();
    if (max === 0) return 0;
    return Math.min(100, Math.max(0, (this.value() / max) * 100));
  });

  readonly percentageDisplay = computed(() => `${Math.round(this.percentage())}%`);
  readonly barWidth = computed(() => `${this.percentage()}%`);
}





