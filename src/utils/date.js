/**
 * Parses a YYYY-MM-DD string into a local Date (no UTC shift).
 *
 * @example parseLocalDate('2026-05-18') → Date for May 18 at 00:00 local time
 */
export function parseLocalDate(dateStr) {
  if (!dateStr && dateStr !== 0) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).split('T')[0];
  const [y, m, d] = str.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}
