// libs/shared/ui/src/lib/skeleton/skeleton.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'gh-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'borderRadius()',
  },
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly borderRadius = input<string>('var(--radius-sm)');
}





