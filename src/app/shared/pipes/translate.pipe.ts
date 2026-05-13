import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '@app/core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  readonly #i18n = inject(TranslationService);

  transform(key: string, params?: Record<string, string>): string {
    return this.#i18n.translate(key, params);
  }
}





