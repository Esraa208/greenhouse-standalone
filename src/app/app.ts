import { Component, signal, effect, inject } from '@angular/core';
import { MainLayoutComponent } from '@app/shared/components';
import { TranslationService } from '@app/core';
import { ThemeService } from '@app/core';

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('greenhouse-standalone');
  readonly #i18n: TranslationService = inject(TranslationService);

  constructor() {
    inject(ThemeService);
    effect(() => {
      document.documentElement.setAttribute('dir', this.#i18n.dir());
      document.documentElement.setAttribute('lang', this.#i18n.currentLang());
    });
  }
}






