// libs/shared/ui/src/lib/page-header/page-header.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Breadcrumb {
  readonly label: string;
  readonly path?: string;
}

export type PageHeaderButtonVariant = 'primary' | 'warning';

@Component({
  selector: 'gh-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gh-page-header-host',
  },
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly buttonLabel = input<string>('');
  readonly buttonVariant = input<PageHeaderButtonVariant>('primary');
  readonly buttonIcon = input<string>('');
  readonly buttonClick = output<void>();

  // Legacy inputs to prevent breaking other pages
  readonly description = input<string>('');
  readonly breadcrumbs = input<ReadonlyArray<Breadcrumb>>([]);
  readonly actions = input<TemplateRef<unknown> | null>(null);

  readonly buttonClass = computed(() =>
    this.buttonVariant() === 'warning'
      ? 'gh-page-header__btn gh-page-header__btn--warning'
      : 'gh-page-header__btn',
  );

  readonly buttonIconText = computed(() => this.buttonIcon().trim() || '+');
}
