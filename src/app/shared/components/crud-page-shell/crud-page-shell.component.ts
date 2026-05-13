import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Thin layout wrapper for CRUD-style feature pages: applies page shell class + `dir`.
 * Project table / filters / header as children in document order (header → filters → card → modals).
 *
 * Optional named slots via `data-gh-crud-slot` for readability only (no extra DOM from the host).
 */
@Component({
  selector: 'gh-crud-page-shell',
  standalone: true,
  template: `
    <div class="gh-crud-page-shell" [attr.dir]="dir()" role="region">
      <ng-content select="[data-gh-crud-slot=header]" />
      <ng-content select="[data-gh-crud-slot=filters]" />
      <ng-content select="[data-gh-crud-slot=body]" />
      <ng-content />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .gh-crud-page-shell {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GhCrudPageShellComponent {
  /** Binds to `[attr.dir]` for RTL/LTR (typically `i18n.dir()`). */
  readonly dir = input<string>('ltr');
}
