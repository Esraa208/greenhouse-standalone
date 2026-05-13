import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gh-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalCount = input<number>(0);
  readonly pageSize = input<number>(10);

  readonly pageChange = output<number>();

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

  readonly rangeStart = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalCount()));

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
}
