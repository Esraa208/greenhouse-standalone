// libs/shared/ui-layout/src/lib/topbar/topbar.component.ts
// Optimized for i18n support
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@app/core';
import { TranslatePipe } from '@app/shared/pipes';
import { ThemeService } from '@app/core';
import { BreakpointService } from '@app/core';
import { AvatarComponent } from '@app/shared/components';

@Component({
  selector: 'gh-topbar',
  standalone: true,
  imports: [CommonModule, AvatarComponent, TranslatePipe],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly #i18n = inject(TranslationService);
  readonly #theme = inject(ThemeService);
  readonly #bp = inject(BreakpointService);

  readonly sidebarOpen = model<boolean>(false);

  readonly isDarkMode = this.#theme.isDarkMode;
  readonly currentLang = this.#i18n.currentLang;
  readonly isDesktop = this.#bp.isDesktop;

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'topbar.greeting_morning';
    if (hour < 17) return 'topbar.greeting_afternoon';
    return 'topbar.greeting_evening';
  });

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  switchLang(lang: 'ar' | 'en'): void {
    this.#i18n.setLanguage(lang);
  }

  toggleTheme(): void {
    this.#theme.toggleTheme();
  }
}






