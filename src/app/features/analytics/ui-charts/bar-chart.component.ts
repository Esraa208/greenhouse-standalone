// libs/analytics/ui-charts/src/lib/bar-chart.component.ts
import { ChangeDetectionStrategy, Component, effect, input, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ThemeService } from '@app/core';

@Component({
  selector: 'gh-bar-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `<canvas baseChart [data]="chartData()" [options]="chartOptions()" [type]="barChartType"></canvas>`,
  styles: [`:host { display: block; position: relative; width: 100%; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  readonly #theme = inject(ThemeService);
  
  readonly chartData = input.required<ChartConfiguration<'bar'>['data']>();
  readonly chartOptions = input<ChartConfiguration<'bar'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { border: { display: false } }
    }
  });

  readonly barChartType = 'bar' as const;
  readonly chart = viewChild(BaseChartDirective);

  constructor() {
    effect(() => {
      // Re-render chart on theme change
      this.#theme.isDarkMode();
      const currentChart = this.chart();
      if (currentChart?.chart) {
         currentChart.chart.update();
      }
    });
  }
}






