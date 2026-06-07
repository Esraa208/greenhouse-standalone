/** `YYYY-MM-DD` for `<input type="date">`. */
export function todayDateInputValue(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Maps ISO / API datetime → `YYYY-MM-DD` for date inputs. */
export function isoToDateInputValue(iso?: string): string {
  if (!iso?.trim()) return '';
  return iso.trim().slice(0, 10);
}

/** Maps date input → API ISO datetime. */
export function dateInputToApiDateTime(dateInput: string): string {
  const [y, m, d] = dateInput.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}
