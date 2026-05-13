// libs/analytics/ui-charts/src/lib/line-chart.component.ts
import { ChangeDetectionStrategy, Component, effect, input, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ThemeService } from '@app/core';

@Component({
  selector: 'gh-line-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `<canvas baseChart [data]="chartData()" [options]="chartOptions()" [type]="lineChartType"></canvas>`,
  styles: [`:host { display: block; position: relative; width: 100%; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  readonly #theme = inject(ThemeService);

  readonly chartData = input.required<ChartConfiguration<'line'>['data']>();
  readonly chartOptions = input<ChartConfiguration<'line'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { border: { display: false } }
    }
  });

  readonly lineChartType = 'line' as const;
  readonly chart = viewChild(BaseChartDirective);

  constructor() {
    effect(() => {
      this.#theme.isDarkMode();
      const currentChart = this.chart();
      if (currentChart?.chart) {
         currentChart.chart.update();
      }
    });
  }
}






