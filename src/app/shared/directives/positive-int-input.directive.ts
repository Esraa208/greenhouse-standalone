import { Directive, HostListener } from '@angular/core';

const NAVIGATION_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/** Allows digits 0–9 only (no sign, decimal, or exponent) via keyboard and paste. */
@Directive({
  selector: 'input[ghPositiveInt]',
  standalone: true,
})
export class PositiveIntInputDirective {
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (NAVIGATION_KEYS.has(event.key)) {
      return;
    }
    if (/^\d$/.test(event.key)) {
      return;
    }
    event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\d*$/.test(text)) {
      event.preventDefault();
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    const text = event.dataTransfer?.getData('text') ?? '';
    if (!/^\d*$/.test(text)) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    if (input.value !== digits) {
      input.value = digits;
    }
  }
}
