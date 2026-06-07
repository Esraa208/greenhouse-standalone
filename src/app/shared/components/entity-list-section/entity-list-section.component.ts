import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@app/shared/pipes';
import { EmptyStateComponent } from '../ui/empty-state/empty-state.component';
import { TableComponent } from '../ui/table/table.component';
import { PaginationComponent } from '../ui/pagination/pagination.component';

/** Shared card + spinner + empty + `<gh-table>` + pagination shell for CRUD index pages. */
@Component({
  selector: 'gh-entity-list-section',
  standalone: true,
  imports: [TranslatePipe, EmptyStateComponent, TableComponent, PaginationComponent],
  template: `
    <div class="gh-card">
      @if (loading() && itemCount() === 0) {
        <div class="gh-card__list-loading" role="status" aria-busy="true" aria-live="polite">
          <span class="gh-card__list-loading-spinner" aria-hidden="true"></span>
        </div>
      } @else if (!loading() && itemCount() === 0) {
        <gh-empty-state [title]="emptyTitleKey() | translate" />
      } @else {
        <gh-table [loading]="loading()">
          <ng-content />
        </gh-table>
        <div class="gh-card__footer">
          <gh-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            [totalCount]="totalCount()"
            [itemCount]="itemCount()"
            [pageSize]="pageSize()"
            (pageChange)="pageChange.emit($event)"
            (pageSizeChange)="pageSizeChange.emit($event)" />
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GhEntityListSectionComponent {
  readonly loading = input.required<boolean>();
  readonly itemCount = input.required<number>();
  readonly emptyTitleKey = input.required<string>();
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly totalCount = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
}
