/** Parse a string to a non-negative integer (digits only). */
export function parsePositiveInt(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return 0;
  }
  return parseInt(digits, 10);
}
