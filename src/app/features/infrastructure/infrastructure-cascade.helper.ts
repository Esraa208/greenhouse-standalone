/** Keeps the edited parent/child in dropdowns when it is inactive or not in the scoped API list. */
export function withEditFallback<T extends { id: string }>(
  base: readonly T[],
  all: readonly T[],
  editingId: string | undefined | null
): T[] {
  const id = editingId?.trim();
  if (!id) return [...base];
  if (base.some((x) => x.id === id)) return [...base];
  const linked = all.find((x) => x.id === id);
  return linked ? [...base, linked] : [...base];
}

/** Edit fallback applies only while the selected parent still matches the record being edited. */
export interface CascadeEditContext {
  readonly parentId: string;
  readonly childId: string;
}

/** Modal dropdown: empty until parent is chosen; scoped API list + conditional edit fallback. */
export function modalCascadeOptions<T extends { id: string }>(
  parentId: string,
  scoped: readonly T[],
  all: readonly T[],
  formChildId: string | undefined | null,
  editContext?: CascadeEditContext | null
): T[] {
  if (!parentId?.trim()) return [];
  const formId = formChildId?.trim();
  let fallbackId = formId || undefined;
  if (
    !fallbackId &&
    editContext?.parentId === parentId &&
    editContext.childId?.trim()
  ) {
    fallbackId = editContext.childId.trim();
  }
  return withEditFallback(scoped, all, fallbackId);
}
