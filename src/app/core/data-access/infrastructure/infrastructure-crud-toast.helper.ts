import { GhToastService, TranslationService } from '@app/core';

export type InfrastructureEntityI18nKey =
  | 'locations'
  | 'greenhouses'
  | 'zones'
  | 'systems'
  | 'layers'
  | 'pipes';

export type InfrastructureCrudToastAction = 'create' | 'edit' | 'delete';

export function toastInfrastructureCrudSuccess(
  toast: GhToastService,
  i18n: TranslationService,
  entity: InfrastructureEntityI18nKey,
  action: InfrastructureCrudToastAction
): void {
  toast.success(i18n.t(`${entity}.toast_${action}_success`));
}
