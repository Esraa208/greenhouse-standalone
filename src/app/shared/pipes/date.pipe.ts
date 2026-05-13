import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '@app/core/services/translation.service';

@Pipe({
  name: 'ghDate',
  pure: false,
  standalone: true,
})
export class GhDatePipe implements PipeTransform {
  readonly #i18n = inject(TranslationService);

  transform(value: string | number | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const lang = this.#i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}







