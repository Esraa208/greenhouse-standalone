/** Replace backend/user «يونت» (unit) wording with «صوبا» in display labels. */
export function normalizeGreenhouseLabel(text: string | null | undefined): string {
  if (text == null) return '';
  const value = String(text).trim();
  if (!value) return '';
  return value.replace(/يونت/g, 'صوبا');
}
