import { effect } from '@angular/core';
import type { FormGroup } from '@angular/forms';

export interface SyncCrudModalFormOptions<TEditing> {
  isModalOpen: () => boolean;
  editingItem: () => TEditing | null | undefined;
  form: FormGroup;
  patchFromItem: (item: TEditing) => void;
  defaultValue: Record<string, unknown> | (() => Record<string, unknown>);
  /**
   * Modal open with no editing row (create mode). Default: `form.reset(defaults)`.
   * Override when you need non-default behaviour while staying on the scheduled runner.
   */
  onOpenWithoutEditing?: () => void;
  /** Wrap patch/reset (e.g. `queueMicrotask` + `ChangeDetectorRef.markForCheck`). */
  schedule?: (run: () => void) => void;
}

/**
 * Keeps a reactive form aligned with facade-style modal state:
 * - closed → reset to defaults
 * - open + row → patch
 * - open + no row (create) → reset (or `onOpenWithoutEditing`)
 *
 * Call from a component constructor (injection context).
 */
export function syncCrudModalForm<TEditing>(opts: SyncCrudModalFormOptions<TEditing>): void {
  effect(() => {
    const open = opts.isModalOpen();
    const item = opts.editingItem();
    const defaults =
      typeof opts.defaultValue === 'function' ? opts.defaultValue() : opts.defaultValue;

    const run = opts.schedule ?? ((fn: () => void) => {
      fn();
    });

    if (!open) {
      run(() => opts.form.reset(defaults));
      return;
    }

    if (item != null) {
      run(() => opts.patchFromItem(item));
    } else {
      run(() => {
        if (opts.onOpenWithoutEditing) opts.onOpenWithoutEditing();
        else opts.form.reset(defaults);
      });
    }
  });
}

export function trackByEntityId(_index: number, row: { id: string }): string {
  return row.id;
}
