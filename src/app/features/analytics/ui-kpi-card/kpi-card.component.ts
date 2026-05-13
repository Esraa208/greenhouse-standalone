// libs/analytics/ui-kpi-card/src/lib/kpi-card.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gh-analytics-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>('');
  readonly trend = input<{ value: number; label: string } | null>(null);
  
  // Future: simple native SVG sparkline representation
  readonly sparklineData = input<number[]>([]);
}





