import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@app/shared/pipes';
import {
  GhBadgeComponent,
  GhButtonComponent,
  GhDeleteConfirmModalComponent,
  GhEmptyStateComponent,
  GhFormGroupComponent,
  GhInputComponent, 
  GhModalComponent,
  GhPageHeaderComponent,
  GhPaginationComponent,
  GhProgressBarComponent,
  GhSegmentedControlComponent,
  GhSelectComponent,
  GhTableComponent,
  GhTableFiltersComponent,
} from '@app/shared/components';

/**
 * Shared standalone import bundles for list + modal CRUD pages (infrastructure, operations, sales).
 * Prefer these over duplicating `Gh*` lists per component.
 */
export const CRUD_LIST_PAGE_IMPORTS_STANDARD = [
  CommonModule,
  ReactiveFormsModule,
  TranslatePipe,
  GhPageHeaderComponent,
  GhTableFiltersComponent,
  GhTableComponent,
  GhBadgeComponent,
  GhButtonComponent,
  GhEmptyStateComponent,
  GhModalComponent,
  GhFormGroupComponent,
  GhInputComponent,
  GhSegmentedControlComponent,
  GhSelectComponent,
  GhDeleteConfirmModalComponent,
  GhPaginationComponent,
] as const;

export const CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS = [
  ...CRUD_LIST_PAGE_IMPORTS_STANDARD,
  GhProgressBarComponent,
] as const;

/**
 * Header + filters + table + detail modal + delete confirm + progress; no reactive form helpers in template (e.g. batches view modal).
 */
export const CRUD_LIST_PAGE_IMPORTS_TABLE_VIEW_MODAL = [
  CommonModule,
  TranslatePipe,
  GhPageHeaderComponent,
  GhTableFiltersComponent,
  GhTableComponent,
  GhBadgeComponent,
  GhButtonComponent,
  GhEmptyStateComponent,
  GhModalComponent,
  GhDeleteConfirmModalComponent,
  GhProgressBarComponent,
  GhPaginationComponent,
] as const;

/** Form + modal flows without delete-confirm (e.g. losses). */
export const CRUD_LIST_PAGE_IMPORTS_NO_DELETE_CONFIRM = [
  CommonModule,
  ReactiveFormsModule,
  TranslatePipe,
  GhPageHeaderComponent,
  GhTableFiltersComponent,
  GhTableComponent,
  GhBadgeComponent,
  GhButtonComponent,
  GhEmptyStateComponent,
  GhModalComponent,
  GhFormGroupComponent,
  GhInputComponent,
  GhSegmentedControlComponent,
  GhPaginationComponent,
] as const;

/** Modal with reactive form, no segmented control / delete confirm (e.g. harvest). */
export const CRUD_LIST_PAGE_IMPORTS_FORM_MODAL = [
  CommonModule,
  ReactiveFormsModule,
  TranslatePipe,
  GhPageHeaderComponent,
  GhTableFiltersComponent,
  GhTableComponent,
  GhBadgeComponent,
  GhButtonComponent,
  GhEmptyStateComponent,
  GhModalComponent,
  GhFormGroupComponent,
  GhInputComponent,
  GhPaginationComponent,
] as const;
