// libs/shared/ui/src/lib/empty-state/empty-state.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gh-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly action = input<TemplateRef<unknown> | null>(null);
}





