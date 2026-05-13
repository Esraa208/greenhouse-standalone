import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gh-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"gh-btn gh-btn-" + variant() + " gh-btn-" + size()',
    '[class.gh-btn-full]': 'fullWidth()',
    '[class.is-loading]': 'loading()',
    '[attr.disabled]': '(disabled() || loading()) ? true : null',
  }
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly fullWidth = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly icon = input<TemplateRef<any> | null>(null);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
}





