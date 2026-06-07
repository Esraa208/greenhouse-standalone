/** Domain slugs aligned with API LossType ids (1–5). */
export type LossType = 'disease' | 'weather' | 'electricity' | 'pest' | 'other';

export const LOSS_TYPES: readonly LossType[] = [
  'disease',
  'weather',
  'electricity',
  'pest',
  'other',
];

const API_ID_BY_TYPE: Record<LossType, number> = {
  disease: 1,
  weather: 2,
  electricity: 3,
  pest: 4,
  other: 5,
};

export function mapLossTypeToApi(type: LossType): number {
  return API_ID_BY_TYPE[type] ?? 5;
}

export function mapLossTypeFromApi(id: number): LossType {
  switch (id) {
    case 1:
      return 'disease';
    case 2:
      return 'weather';
    case 3:
      return 'electricity';
    case 4:
      return 'pest';
    case 5:
      return 'other';
    default:
      return 'other';
  }
}

export function lossTypeFromLabel(label: string): LossType | undefined {
  const n = label.trim().toLowerCase();
  if (/مرض|disease/.test(n)) return 'disease';
  if (/طقس|weather/.test(n)) return 'weather';
  if (/كهرب|electric/.test(n)) return 'electricity';
  if (/حشر|pest|insect|آف/.test(n)) return 'pest';
  if (/أخر|آخر|other/.test(n)) return 'other';
  return undefined;
}

export function resolveLossBadgeKind(
  slug: LossType,
  label?: string | null,
): LossType {
  const fromLabel = label ? lossTypeFromLabel(label) : undefined;
  return fromLabel ?? slug;
}
