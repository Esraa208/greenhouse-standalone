
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'gh-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-component.html',
  styleUrl: './modal-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly #destroyRef = inject(DestroyRef);

  readonly isOpen = model<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly iconEmoji = input<string>('');
  readonly size = input<ModalSize>('md');
  readonly showFooter = input<boolean>(true);
  readonly footerTemplate = input<TemplateRef<unknown> | null>(null);

  readonly dialogEl = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  readonly panelClass = computed(
    () => `gh-modal__panel gh-modal__panel--${this.size()}`
  );

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const el = this.dialogEl()?.nativeElement;
      if (!el) return;
      if (open) {
        el.showModal();
      } else {
        el.close();
      }
    });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter((e) => e.key === 'Escape'),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(() => this.close());
  }

  close(): void {
    this.isOpen.set(false);
  }

  onKeyDown(_event: KeyboardEvent): void {
    // Satisfy lint for focusable elements with interaction handlers
  }

  onBackdropClick(event: MouseEvent): void {
    const dialog = this.dialogEl()?.nativeElement;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (clickedOutside) this.close();
  }
}





