import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@app/shared/pipes';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@app/core/data-access/infrastructure';

@Component({
  selector: 'gh-pagination',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'gh-pagination-host' },
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalCount = input<number>(0);
  /** Fallback when API omits totalCount (e.g. current page item count). */
  readonly itemCount = input<number>(0);
  readonly pageSize = input<number>(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = input<readonly number[]>(PAGE_SIZE_OPTIONS);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly displayTotalCount = computed(() => {
    const total = this.totalCount();
    return total > 0 ? total : this.itemCount();
  });

  readonly hasPrev = computed(() => this.currentPage() > 1);
  readonly hasNext = computed(() => this.currentPage() < this.totalPages());

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  readonly rangeStart = computed(() => {
    const total = this.displayTotalCount();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly rangeEnd = computed(() => {
    const total = this.displayTotalCount();
    if (total === 0) return 0;
    return Math.min(this.currentPage() * this.pageSize(), total);
  });

  goToPage(page: number | '...'): void {
    if (page === '...') return;
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  prev(): void {
    if (this.hasPrev()) this.goToPage(this.currentPage() - 1);
  }

  next(): void {
    if (this.hasNext()) this.goToPage(this.currentPage() + 1);
  }

  onPageSizeChange(value: number | string): void {
    const size = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(size) || size <= 0 || size === this.pageSize()) return;
    this.pageSizeChange.emit(size);
  }
}
