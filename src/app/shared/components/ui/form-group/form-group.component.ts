import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'gh-form-group',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-group" [class.has-error]="control()?.invalid && (control()?.touched || control()?.dirty)">
      @if (label()) {
        <label class="form-label" [for]="labelId()">
          @if (icon()) {
            <span class="form-label__icon" style="color: var(--color-primary, #8b5cf6);">{{ icon() }}</span>
          } @else {
            <span class="form-label__dot"></span>
          }
          <span class="form-label__text">{{ label() }}</span>
          @if (control()?.hasValidator(reqValidator) || required()) {
            <span class="form-label__required">*</span>
          }
        </label>
      }
      
      <div class="form-group__control">
        <ng-content></ng-content>
      </div>

      @if (control()?.invalid && (control()?.touched || control()?.dirty) && errorMessage()) {
        <p class="form-error">
          ⚠ {{ errorMessage() }}
        </p>
      }
      
      @if (helperText()) {
        <p class="form-helper">
          {{ helperText() }}
        </p>
      }
    </div>
  `,
  styles: [`
    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
  `]
})
export class FormGroupComponent {
  readonly label = input<string>('');
  readonly icon = input<string>('');
  readonly labelId = input<string>('');
  readonly errorMessage = input<string>('');
  readonly helperText = input<string>('');
  readonly control = input<AbstractControl | null>(null);
  readonly required = input<boolean>(false);
  readonly reqValidator = Validators.required;
}





