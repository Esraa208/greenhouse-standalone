import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
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
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly id = input<string>(`gh-input-${Math.random().toString(36).substr(2, 9)}`);

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
    this.value.set(target.value);
    this.#onChange(target.value);
  }

  handleBlur(): void {
    this.#onTouched();
  }
}





