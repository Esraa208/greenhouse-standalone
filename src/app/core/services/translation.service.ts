import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, tap, of, catchError, Subject } from 'rxjs';

export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly #handler = inject(HttpBackend);
  readonly #http = new HttpClient(this.#handler);
  readonly #currentLang = signal<'ar' | 'en'>('ar');
  readonly #translations = signal<TranslationMap>({});

  public readonly onLangLoaded = new Subject<void>();
  readonly translations = this.#translations.asReadonly();
  readonly currentLang = this.#currentLang.asReadonly();
  readonly isRTL = computed(() => this.#currentLang() === 'ar');
  readonly dir = computed(() => (this.isRTL() ? 'rtl' : 'ltr'));

  constructor() {
    const savedLang = localStorage.getItem('gh_lang');
    if (savedLang === 'ar' || savedLang === 'en') {
      this.setLanguage(savedLang);
    } else {
      this.setLanguage('ar');
    }
  }

  translate(key: string, params?: Record<string, string>): string {
    if (!key) return '';
    const lookupKey = key.toLowerCase();
    const keys = lookupKey.split('.');
    let value: string | TranslationMap = this.#translations();

    for (const k of keys) {
      if (value && typeof value === 'object') {
        const matchingKey: string | undefined = Object.keys(value).find(
          (prop) => prop.toLowerCase() === k
        );
        if (matchingKey !== undefined) {
          value = value[matchingKey];
        } else {
          return key;
        }
      } else {
        return key;
      }
    }

    if (typeof value === 'string' && params) {
      return Object.keys(params).reduce(
        (str, pKey) => str.replace(new RegExp(`{{${pKey}}}`, 'g'), params[pKey]),
        value
      );
    }
    return typeof value === 'string' ? value : key;
  }

  t(key: string, params?: Record<string, string>): string {
    return this.translate(key, params);
  }

  setLanguage(lang: 'ar' | 'en'): void {
    localStorage.setItem('gh_lang', lang);
    this.#currentLang.set(lang);
    this.loadTranslations(lang).subscribe();
  }

  loadTranslations(lang: 'ar' | 'en'): Observable<TranslationMap | void> {
    const paths = [`/assets/i18n/${lang}.json`, `assets/i18n/${lang}.json`] as const;

    const tryLoad = (index: number): Observable<TranslationMap> => {
      if (index >= paths.length) {
        return of({});
      }

      return this.#http.get<TranslationMap>(paths[index]).pipe(
        catchError(() => tryLoad(index + 1))
      );
    };

    return tryLoad(0).pipe(
      tap((translations) => {
        this.#translations.set(translations);
        this.onLangLoaded.next();
      }),
      catchError((err) => {
        console.error('I18N FETCH ERROR:', err);
        this.#translations.set({});
        this.onLangLoaded.next();
        return of({});
      })
    );
  }
}





