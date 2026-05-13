import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, GhDatePipe } from '@app/shared/pipes';
import {
  GhBadgeComponent,
  GhButtonComponent,
  GhDeleteConfirmModalComponent,
  GhEmptyStateComponent,
  GhFormGroupComponent,
  GhModalComponent,
  GhPageHeaderComponent,
  GhProgressBarComponent,
  GhTableComponent,
  GhTableFiltersComponent,
} from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from './crud-list.imports';

/** Customers CRUD: standard list kit + date pipe. */
export const SALES_CUSTOMERS_PAGE_IMPORTS = [
  GhDatePipe,
  ...CRUD_LIST_PAGE_IMPORTS_STANDARD,
] as const;

/** Invoices: list + detail modal, no delete-confirm / form-group / segmented. */
export const SALES_INVOICES_PAGE_IMPORTS = [
  CommonModule,
  TranslatePipe,
  GhDatePipe,
  GhPageHeaderComponent,
  GhTableFiltersComponent,
  GhTableComponent,
  GhBadgeComponent,
  GhButtonComponent,
  GhEmptyStateComponent,
  GhModalComponent,
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
