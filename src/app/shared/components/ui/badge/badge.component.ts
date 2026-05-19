import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Documented badge variants — the input accepts any string to keep template bindings flexible. */
export type BadgeVariant =
  | 'success' | 'warning' | 'danger' | 'info' | 'default'
  | 'active'  | 'inactive' | 'harvested'
  | 'full'    | 'partial' | 'empty';

@Component({
  selector: 'gh-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"gh-badge gh-badge-" + variant()'
  }
})
export class BadgeComponent {
  // Accepts any string so template ternary expressions don't require an explicit cast.
  readonly variant = input<string>('default');
}






