// libs/shared/ui-layout/src/lib/main-layout/main-layout.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastContainerComponent } from '@app/shared/components';

@Component({
  selector: 'gh-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    TopbarComponent,
    ToastContainerComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);

  readonly sidebarOpen = signal<boolean>(false);
  readonly currentRoute = signal<string>('');

  constructor() {
    // Track current route for sidebar active state
    this.#router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(e => this.currentRoute.set(e.urlAfterRedirects));

    // Set initial route
    this.currentRoute.set(this.#router.url);
  }
}







