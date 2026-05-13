/**
 * PUT handlers often don't return the full entity. We only map changed fields from the DTO
 * and merge with the previous table row so counters, names, and capacity don't reset to 0.
 */
export type PutPatch<T extends { id: string }> = Partial<Omit<T, 'id'>> & Pick<T, 'id'>;

export function mergeAfterPut<T extends { id: string }>(
  previous: T | undefined,
  patch: PutPatch<T>
): T {
  return { ...(previous ?? ({} as Partial<T>)), ...patch } as T;
}
