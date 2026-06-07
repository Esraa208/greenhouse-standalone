import { ChangeDetectionStrategy, Component, forwardRef, input, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'gh-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly suffix = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly id = input<string>(`gh-input-${Math.random().toString(36).substr(2, 9)}`);
  readonly positiveOnly = input<boolean>(false);

  /** When positiveOnly is on, use text + numeric inputmode to avoid browser number quirks. */
  readonly effectiveType = computed(() => this.positiveOnly() ? 'text' : this.type());
  readonly effectiveInputmode = computed(() => this.positiveOnly() ? 'numeric' : undefined);

  readonly value = signal<string>('');
  readonly disabled = signal<boolean>(false);

  #onChange = (_value: string) => {};
  #onTouched = () => {};

  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = target.value;

    if (this.positiveOnly()) {
      val = val.replace(/\D/g, '');
      if (target.value !== val) {
        target.value = val;
      }
    }

    this.value.set(val);
    this.#onChange(val);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.positiveOnly()) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const navKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (navKeys.includes(event.key)) return;

    if (/^\d$/.test(event.key)) return;

    event.preventDefault();
  }

  handlePaste(event: ClipboardEvent): void {
    if (!this.positiveOnly()) return;
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\d*$/.test(text)) {
      event.preventDefault();
    }
  }

  handleBlur(): void {
    this.#onTouched();
  }
}





