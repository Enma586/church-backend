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
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Parses a YYYY-MM-DD string to start of day in UTC.
 * Use with $gte (greater than or equal) to include entries from that day.
 */
export function dateFromFilter(input) {
  const d = parseLocalDate(input);
  return d;
}

/**
 * Parses a YYYY-MM-DD string to END of day in UTC (23:59:59.999).
 * Use with $lte (less than or equal) to include entries up to that day.
 */
export function dateToFilter(input) {
  const d = parseLocalDate(input);
  if (!d) return null;
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
