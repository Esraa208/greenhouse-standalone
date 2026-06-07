import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, GhDatePipe } from '@app/shared/pipes';
import {
  GhBadgeComponent,
  GhButtonComponent,
  GhDeleteConfirmModalComponent,
  GhEmptyStateComponent,
  GhEntityListSectionComponent,
  GhFormGroupComponent,
  GhModalComponent,
  GhPageHeaderComponent,
  GhProgressBarComponent,
  GhTableComponent,
  GhTableFiltersComponent,
} from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD, CRUD_LIST_PAGE_IMPORTS_TABLE_VIEW_MODAL } from './crud-list.imports';

/** Customers CRUD: standard list kit + date pipe + paginated table shell. */
export const SALES_CUSTOMERS_PAGE_IMPORTS = [
  GhDatePipe,
  GhEntityListSectionComponent,
  ...CRUD_LIST_PAGE_IMPORTS_STANDARD,
] as const;

/** Invoices: paginated list + print preview modal. */
export const SALES_INVOICES_PAGE_IMPORTS = [
  GhDatePipe,
  GhEntityListSectionComponent,
  ...CRUD_LIST_PAGE_IMPORTS_TABLE_VIEW_MODAL,
] as const;

/** Sales report page (KPI-style). */
export const SALES_REPORTS_PAGE_IMPORTS = [
  CommonModule,
  TranslatePipe,
  GhPageHeaderComponent,
  GhBadgeComponent,
  GhProgressBarComponent,
  GhEmptyStateComponent,
] as const;
