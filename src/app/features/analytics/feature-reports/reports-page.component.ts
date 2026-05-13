import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GhPageHeaderComponent,
  GhSegmentedControlComponent,
  GhButtonComponent,
  GhBadgeComponent,
  GhTableComponent,
} from '@app/shared/components';
import { ArabicNumeralPipe, TranslatePipe } from '@app/shared/pipes';
import { AnalyticsReportsFacade } from '@app/core/data-access/analytics';
import { trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-analytics-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    ArabicNumeralPipe,
    TranslatePipe,
    GhPageHeaderComponent,
    GhSegmentedControlComponent,
    GhButtonComponent,
    GhBadgeComponent,
    GhTableComponent,
  ],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent implements OnInit {
  readonly #facade = inject(AnalyticsReportsFacade);

  readonly summaries = this.#facade.summaries;
  readonly costMatrix = this.#facade.costMatrix;
  readonly isLoading = this.#facade.isLoading;
  readonly activeTab = this.#facade.activeTab;

  ngOnInit(): void {
    this.#facade.load();
  }

  onTabChange(tab: string): void {
    if (tab === 'summary' || tab === 'costs') {
      this.#facade.setTab(tab);
    }
  }

  download(id: string): void {
    this.#facade.downloadReport(id);
  }

  readonly trackBySummaryId = trackByEntityId;
  readonly trackByCostId = trackByEntityId;
}
