// libs/shared/ui/src/lib/table/table.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gh-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  readonly stickyHeader = input<boolean>(true);
  readonly striped = input<boolean>(false);
  readonly hoverable = input<boolean>(true);
  readonly loading = input<boolean>(false);
}





