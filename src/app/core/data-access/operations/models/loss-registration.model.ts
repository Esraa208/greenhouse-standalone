import type { LossType } from './loss.model';

export interface LossRegistrationBatch {
  readonly id: string;
  readonly batchNumber: string;
  readonly cropType: string;
  readonly layerCount: number;
  readonly totalQuantity: number;
}

export interface LossRegistrationAllocation {
  readonly id: string;
  readonly pipeName: string;
  readonly quantity: number;
}

export interface LossRegistrationLayer {
  readonly id: string;
  /** Display label or layer position number as string */
  readonly name: string;
  readonly layerPosition: number;
  readonly path: string;
  readonly allocationCount: number;
  readonly totalQuantity: number;
  readonly allocations: readonly LossRegistrationAllocation[];
}

export interface CreateBatchLossDto {
  readonly batchId: string;
  readonly lossType: LossType;
  readonly date: string;
  readonly quantity: number;
  readonly reason: string;
  readonly notes?: string;
  readonly registerWholeBatch: boolean;
  readonly items: readonly { readonly housingId: string; readonly quantity: number }[];
}
