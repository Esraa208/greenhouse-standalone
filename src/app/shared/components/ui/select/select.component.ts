import {
  ChangeDetectionStrategy, Component, computed,
  forwardRef, inject, input, output, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { TranslationService } from '@app/core';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'gh-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectComponent],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  readonly #i18n = inject(TranslationService);
  readonly notFoundText = computed(() => this.#i18n.t('common.select_no_items'));

  readonly label = input<string>('');
  readonly placeholder = input<string>('Select an option');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly options = input<SelectOption[]>([]);
  readonly items = input<readonly { id: string; name: string }[]>([]);
  readonly id = input<string>(`gh-select-${Math.random().toString(36).substr(2, 9)}`);
  readonly selectionChange = output<any>();

  protected readonly effectiveOptions = computed(() => {
    const explicit = this.options();
    if (explicit.length) return explicit;
    return this.items().map(it => ({ label: it.name, value: it.id }));
  });

  readonly value = signal<any>(null);
  readonly disabled = signal<boolean>(false);

  #onChange: (value: any) => void = () => { /* default */ };
  #onTouched: () => void = () => { /* default */ };

  writeValue(val: any): void {
    this.value.set(val === '' || val == null ? null : val);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onNgSelectChange(selected: any): void {
    const formVal = selected ?? '';
    this.value.set(selected == null ? null : selected);
    this.#onChange(formVal);
    this.selectionChange.emit(formVal);
  }

  onBlur(): void {
    this.#onTouched();
  }
}
