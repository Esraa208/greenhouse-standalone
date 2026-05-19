// libs/shared/ui/src/lib/table-filters/table-filters.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  model,
  output,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@app/shared/pipes';

export interface SortOption {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'gh-table-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './table-filters.component.html',
  styleUrl: './table-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFiltersComponent {
  readonly search = model<string>('');
  readonly status = model<string>('all');
  readonly sort = model<string>('');

  readonly sortOptions = input<SortOption[]>([]);
  /** When set, replaces default active/inactive status options. */
  readonly statusOptions = input<SortOption[] | undefined>(undefined);
  readonly searchPlaceholder = input<string>('Search...');
  readonly showStatus = input<boolean>(true);
  readonly showSort = input<boolean>(true);

  readonly searchChange = output<string>();
  readonly statusChange = output<string>();
  readonly sortChange = output<string>();

  onSearch(value: string): void {
    this.search.set(value);
    this.searchChange.emit(value);
  }

  onStatus(value: string): void {
    this.status.set(value);
    this.statusChange.emit(value);
  }

  onSort(value: string): void {
    this.sort.set(value);
    this.sortChange.emit(value);
  }
}






