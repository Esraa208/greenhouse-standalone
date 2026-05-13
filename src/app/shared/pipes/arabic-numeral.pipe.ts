import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '@app/core/services/translation.service';

@Pipe({
  name: 'arabicNumeral',
  pure: false,
  standalone: true
})
export class ArabicNumeralPipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return String(value);

    const lang = this.i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(lang).format(num);
  }
}







