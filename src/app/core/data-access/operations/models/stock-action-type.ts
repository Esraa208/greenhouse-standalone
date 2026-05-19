/** Mirrors backend `ActionType` for batch/distribution history. */
export enum StockActionType {
  AddStock = 1,
  RemoveStock = 2,
  TransferStock = 3,
  MergeStock = 4,
  HarvestStock = 5,
  Loss = 6,
}

export function isTransferLikeAction(type: StockActionType): boolean {
  return type === StockActionType.TransferStock || type === StockActionType.MergeStock;
}
