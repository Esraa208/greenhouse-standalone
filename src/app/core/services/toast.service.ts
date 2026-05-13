// libs/shared/ui/src/lib/toast/toast.service.ts
import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class GhToastService {
  readonly #toasts = signal<Toast[]>([]);
  readonly toasts = this.#toasts.asReadonly();

  success(message: string): void {
    this.#add({ message, variant: 'success' });
  }

  error(message: string): void {
    this.#add({ message, variant: 'error' });
  }

  warning(message: string): void {
    this.#add({ message, variant: 'warning' });
  }

  info(message: string): void {
    this.#add({ message, variant: 'info' });
  }

  dismiss(id: string): void {
    this.#toasts.update((list) => list.filter((t) => t.id !== id));
  }

  #add(opts: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID();
    this.#toasts.update((list) => [...list, { id, ...opts }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}





