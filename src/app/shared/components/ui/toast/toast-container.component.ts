// libs/shared/ui/src/lib/toast/toast-container.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GhToastService, Toast } from '@app/core/services/toast.service';

@Component({
  selector: 'gh-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly #toastService = inject(GhToastService);
  readonly toasts = this.#toastService.toasts;

  trackById = (_: number, t: Toast) => t.id;

  dismiss(id: string): void {
    this.#toastService.dismiss(id);
  }

  icon(variant: Toast['variant']): string {
    const icons: Record<Toast['variant'], string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[variant];
  }
}





