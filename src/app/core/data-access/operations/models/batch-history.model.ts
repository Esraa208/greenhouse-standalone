import type { StockActionType } from './stock-action-type';

export interface StockHistoryLocation {
  readonly location: string;
  readonly greenhouse: string;
  readonly zone: string;
  readonly system: string;
  readonly layerLabel: string;
}

export interface StockHistoryEntry {
  readonly id: string;
  readonly actionType: StockActionType;
  readonly date: string;
  readonly quantity: number;
  /** Present for transfer / merge actions */
  readonly from?: StockHistoryLocation;
  /** Primary or destination location */
  readonly to: StockHistoryLocation;
  readonly lossType?: number | string;
  readonly reason?: string;
  readonly notes?: string;
  readonly recordedBy?: string;
}

export interface HousingHistorySummary {
  readonly housingId: string;
  readonly distributionId: string;
  readonly stockBatchId: string;
  readonly currentQuantity: number;
  readonly location: StockHistoryLocation;
}

export interface HousingHistoryResult {
  readonly summary: HousingHistorySummary;
  readonly entries: readonly StockHistoryEntry[];
}
