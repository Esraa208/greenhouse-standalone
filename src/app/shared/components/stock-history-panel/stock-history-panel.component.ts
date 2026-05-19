import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@app/shared/pipes';
import { TranslationService } from '@app/core';
import { BadgeComponent } from '../ui/badge/badge.component';
import {
  StockActionType,
  isTransferLikeAction,
} from '@app/core/data-access/operations/models/stock-action-type';
import type {
  StockHistoryEntry,
  StockHistoryLocation,
} from '@app/core/data-access/operations/models/batch-history.model';

@Component({
  selector: 'gh-stock-history-panel',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, TranslatePipe, BadgeComponent],
  templateUrl: './stock-history-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockHistoryPanelComponent {
  protected readonly StockActionType = StockActionType;
  protected readonly i18n = inject(TranslationService);

  readonly batchNumber = input.required<string>();
  readonly cropType = input('');
  readonly quantity = input(0);
  readonly entries = input<readonly StockHistoryEntry[]>([]);
  readonly loading = input(false);
  readonly showTimelineTitle = input(true);
  readonly footerCountKey = input('stockHistory.total_events');
  readonly footerSuffixKey = input('stockHistory.events_suffix');

  readonly eventCount = computed(() => this.entries().length);

  protected dotVariant(type: StockActionType): string {
    switch (type) {
      case StockActionType.AddStock:
        return 'blue';
      case StockActionType.TransferStock:
      case StockActionType.MergeStock:
        return 'amber';
      case StockActionType.HarvestStock:
        return 'green';
      case StockActionType.Loss:
      case StockActionType.RemoveStock:
        return 'red';
      default:
        return 'muted';
    }
  }

  protected dotIcon(type: StockActionType): string {
    switch (type) {
      case StockActionType.AddStock:
        return '📦';
      case StockActionType.TransferStock:
      case StockActionType.MergeStock:
        return '→';
      case StockActionType.HarvestStock:
        return '📈';
      case StockActionType.Loss:
        return '⚠';
      case StockActionType.RemoveStock:
        return '−';
      default:
        return '•';
    }
  }

  protected actionLabelKey(type: StockActionType): string {
    return `stockHistory.action_${type}`;
  }

  protected badgeVariant(type: StockActionType): string {
    switch (type) {
      case StockActionType.HarvestStock:
        return 'active';
      case StockActionType.Loss:
      case StockActionType.RemoveStock:
        return 'danger';
      case StockActionType.TransferStock:
      case StockActionType.MergeStock:
        return 'inactive';
      default:
        return 'info';
    }
  }

  protected singleCardTone(type: StockActionType): string {
    switch (type) {
      case StockActionType.HarvestStock:
        return 'harvest';
      case StockActionType.Loss:
        return 'loss';
      case StockActionType.RemoveStock:
        return 'remove';
      case StockActionType.AddStock:
        return 'allocate';
      default:
        return 'to';
    }
  }

  protected singleCardLabelKey(type: StockActionType): string {
    switch (type) {
      case StockActionType.HarvestStock:
        return 'stockHistory.harvest_at';
      case StockActionType.Loss:
        return 'stockHistory.loss_at';
      case StockActionType.RemoveStock:
        return 'stockHistory.removed_from';
      case StockActionType.AddStock:
      default:
        return 'stockHistory.allocated_in';
    }
  }

  protected isTransferLike(type: StockActionType): boolean {
    return isTransferLikeAction(type);
  }

  protected formatLayer(loc: StockHistoryLocation): string {
    const raw = loc.layerLabel.trim();
    if (!raw) return '';
    if (/^\d+$/.test(raw)) {
      return this.i18n.t('allocations.layer_number', { count: raw });
    }
    return raw;
  }

  protected trackEntry = (_: number, entry: StockHistoryEntry): string => entry.id;
}
