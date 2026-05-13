import { Injectable, signal, DestroyRef, inject, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  readonly #isMobile = signal(false);
  readonly #isTablet = signal(false);
  
  readonly isMobile = this.#isMobile.asReadonly();
  readonly isTablet = this.#isTablet.asReadonly();
  readonly isDesktop = computed(() => !this.#isMobile() && !this.#isTablet());
  
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    const updateSignals = () => {
      this.#isMobile.set(mobileQuery.matches);
      this.#isTablet.set(tabletQuery.matches);
    };

    updateSignals(); // Init values
    
    // Add listeners
    mobileQuery.addEventListener('change', updateSignals);
    tabletQuery.addEventListener('change', updateSignals);

    this.#destroyRef.onDestroy(() => {
      mobileQuery.removeEventListener('change', updateSignals);
      tabletQuery.removeEventListener('change', updateSignals);
    });
  }
}





