import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #isDarkMode = signal<boolean>(false);
  readonly isDarkMode = this.#isDarkMode.asReadonly();

  constructor() {
    const savedTheme = localStorage.getItem('gh_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      this.#isDarkMode.set(true);
    }

    effect(() => {
      if (this.#isDarkMode()) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('gh_theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('gh_theme', 'light');
      }
    });
  }

  toggleTheme(): void {
    this.#isDarkMode.update(dark => !dark);
  }
}





