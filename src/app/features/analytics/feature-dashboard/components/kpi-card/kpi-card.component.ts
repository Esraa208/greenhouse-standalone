import {
  ChangeDetectionStrategy, Component, input,
  AfterViewInit, viewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../models/dashboard.model';

@Component({
  selector: 'gh-kpi-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-card">
      <div class="kpi-card__accent-bar"></div>
      <div class="kpi-card__body">
        <div class="kpi-card__top">
          <div class="kpi-card__info">
            <p class="kpi-card__label">{{ card().title }}</p>
            <h3 class="kpi-card__value">{{ card().value }}</h3>
            <div class="kpi-card__change"
              [class.kpi-card__change--up]="card().changeType === 'up'"
              [class.kpi-card__change--down]="card().changeType === 'down'">
              <span class="kpi-card__change-arrow">
                {{ card().changeType === 'up' ? '↗' : '↘' }}
              </span>
              <span>{{ card().change }}</span>
            </div>
          </div>
          <div class="kpi-card__icon" [class]="card().iconBg">
            <ng-content select="[slot=icon]"></ng-content>
          </div>
        </div>
        <!-- Sparkline Canvas -->
        <div class="kpi-card__sparkline">
          <canvas #sparklineCanvas></canvas>
        </div>
      </div>
    </div>
  `,
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent implements AfterViewInit {
  readonly card = input.required<KpiCard>();
  readonly sparklineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sparklineCanvas');

  ngAfterViewInit(): void {
    this.#drawSparkline();
  }

  #drawSparkline(): void {
    const canvas = this.sparklineCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.card().sparklineData;
    const color = this.card().sparklineColor;
    const w = canvas.offsetWidth || 200;
    const h = 48;
    canvas.width = w;
    canvas.height = h;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    const points = data.map((v, i) => ({
      x: i * step,
      y: h - ((v - min) / range) * (h - 8) - 4,
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + '55');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}





