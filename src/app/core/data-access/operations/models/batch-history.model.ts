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
}
