import {
  ChangeDetectionStrategy, Component, inject,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardFacade } from './facades/dashboard.facade';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { GhPageHeaderComponent } from '@app/shared/components';
import { TranslationService } from '@app/core';
import { TranslatePipe } from '@app/shared/pipes';

@Component({
  selector: 'gh-dashboard-page',
  standalone: true,
  imports: [CommonModule, GhPageHeaderComponent, BaseChartDirective, KpiCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  readonly #facade = inject(DashboardFacade);
  readonly i18n = inject(TranslationService);

  // Expose facade signals to template
  readonly kpiCards       = this.#facade.kpiCards;
  readonly insights       = this.#facade.insights;
  readonly batchStatuses  = this.#facade.batchStatuses;
  readonly capacityZones  = this.#facade.capacityPercent;
  readonly financialItems = this.#facade.financialItems;
  readonly dateRange      = this.#facade.dateRange;

  // ── Area Chart (Production & Revenue) ───────────────────────
  readonly areaChartData = computed<ChartData<'line'>>(() => {
    const data = this.#facade.productionData();
    const prodLabel = this.i18n.translate('dashboard.legend_production');
    const revLabel = this.i18n.translate('dashboard.legend_revenue');
    const kgUnit = this.i18n.translate('common.kg');

    return {
      labels: data.map(d => d.month),
      datasets: [
        {
          label: `${prodLabel} (${kgUnit})`,
          data: data.map(d => d.production),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          yAxisID: 'y',
        },
        {
          label: `${revLabel} ( ج.م)`,
          data: data.map(d => d.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.10)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          yAxisID: 'y1',
        },
      ],
    };
  });

  readonly areaChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a1a1a',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        rtl: this.i18n.isRTL(),
        textDirection: this.i18n.dir(),
      },
    },
    scales: {
      x: {
        grid: { color: '#f3f4f6' },
        ticks: { color: '#6b7280', font: { size: 12 } },
      },
      y: {
        position: 'left',
        grid: { color: '#f3f4f6' },
        ticks: { color: '#10b981', font: { size: 12 } },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#3b82f6', font: { size: 12 } },
      },
    },
  };

  // ── Bar Chart (Zone Production) ──────────────────────────────
  readonly barChartData = computed<ChartData<'bar'>>(() => {
    const zones = this.#facade.zoneProduction();
    const prodLabel = this.i18n.translate('dashboard.legend_production');

    return {
      labels: zones.map(z => z.name),
      datasets: [{
        label: prodLabel,
        data: zones.map(z => z.value),
        backgroundColor: zones.map(z => z.color),
        borderRadius: 8,
        borderSkipped: false,
      }],
    };
  });

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a1a1a',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        callbacks: { label: ctx => `${ctx.parsed.y} كجم` },
        rtl: true,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' } },
    },
  };

  // ── Doughnut Chart (Crop Distribution) ──────────────────────
  readonly doughnutChartData = computed<ChartData<'doughnut'>>(() => {
    const crops = this.#facade.cropDistribution();
    return {
      labels: crops.map(c => c.name),
      datasets: [{
        data: crops.map(c => c.value),
        backgroundColor: crops.map(c => c.color),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }],
    };
  });

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'left',
        align: 'center',
        labels: {
          color: '#1a1a1a',
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
        rtl: true,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a1a1a',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` },
      },
    },
  };

  // ── Actions ──────────────────────────────────────────────────
  setDateRange(range: '30d' | '90d' | '1y'): void {
    this.#facade.setDateRange(range);
  }

  trackById = (_: number, item: { id: string }): string => item.id;
}






