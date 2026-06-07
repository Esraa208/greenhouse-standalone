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

function sanitizePositiveDecimal(value: string): string {
  let cleaned = value.replace(/[^\d.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    const before = cleaned.slice(0, dotIndex + 1);
    const after = cleaned.slice(dotIndex + 1).replace(/\./g, '');
    cleaned = before + after;
  }
  return cleaned;
}

/** Allows digits and a single decimal point via keyboard and paste. */
@Directive({
  selector: 'input[ghPositiveDecimal]',
  standalone: true,
})
export class PositiveDecimalInputDirective {
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
    if (event.key === '.' || event.key === ',') {
      const input = event.target as HTMLInputElement;
      if (!input.value.includes('.')) {
        if (event.key === ',') {
          event.preventDefault();
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          input.value = `${input.value.slice(0, start)}.${input.value.slice(end)}`;
          input.setSelectionRange(start + 1, start + 1);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }
    }
    event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\d*\.?\d*$/.test(text.replace(',', '.'))) {
      event.preventDefault();
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    const text = event.dataTransfer?.getData('text') ?? '';
    if (!/^\d*\.?\d*$/.test(text.replace(',', '.'))) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizePositiveDecimal(input.value.replace(',', '.'));
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
  }
}
