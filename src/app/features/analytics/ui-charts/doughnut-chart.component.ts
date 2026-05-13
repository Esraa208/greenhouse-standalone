// libs/analytics/ui-charts/src/lib/doughnut-chart.component.ts
import { ChangeDetectionStrategy, Component, effect, input, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ThemeService } from '@app/core';

@Component({
  selector: 'gh-doughnut-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `<canvas baseChart [data]="chartData()" [options]="chartOptions()" [type]="doughnutChartType"></canvas>`,
  styles: [`:host { display: block; position: relative; width: 100%; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoughnutChartComponent {
  readonly #theme = inject(ThemeService);

  readonly chartData = input.required<ChartConfiguration<'doughnut'>['data']>();
  readonly chartOptions = input<ChartConfiguration<'doughnut'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom' }
    }
  });

  readonly doughnutChartType = 'doughnut' as const;
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






