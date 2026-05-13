import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gh-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class.badge--success]="status() === 'active'" [class.badge--default]="status() === 'inactive'">
      {{ status() === 'active' ? 'نشط' : 'غير نشط' }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge--success { background: #dcfce7; color: #16a34a; }
    .badge--default { background: #f3e8ff; color: #7c3aed; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<'active' | 'inactive'>();
}





