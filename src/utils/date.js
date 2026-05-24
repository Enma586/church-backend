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

/**
 * Parses a YYYY-MM-DD string to start of LOCAL day in UTC-6 (Honduras).
 *
 * Los registros se almacenan con la zona horaria del servidor (UTC).
 * Para filtrar correctamente desde Honduras (UTC-6), el inicio del día local
 * es 06:00 UTC y el final del día local es 06:00 UTC del día siguiente.
 *
 * Ej: 31 mayo 23:30 UTC-6 = 1 junio 05:30 UTC → filtro 31 mayo cubre
 *     [31 mayo 06:00 UTC, 1 junio 06:00 UTC) → 05:30 UTC SÍ está dentro.
 */
const LOCAL_OFFSET = 6; // Honduras está en UTC-6, sin horario de verano

export function dateFromFilter(input) {
  if (!input) return null;
  let y, m, d;
  if (input instanceof Date) {
    const s = input.toISOString().slice(0, 10).split('-').map(Number);
    y = s[0]; m = s[1]; d = s[2];
  } else {
    const parts = String(input).split('T')[0].split('-').map(Number);
    y = parts[0]; m = parts[1]; d = parts[2];
  }
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(Date.UTC(y, m - 1, d, LOCAL_OFFSET, 0, 0, 0));
}

/**
 * Parses a YYYY-MM-DD string to start of the NEXT LOCAL day in UTC-6.
 * Use with $lt (strictly less than) to cover the entire local day.
 */
export function dateToFilter(input) {
  if (!input) return null;
  let y, m, d;
  if (input instanceof Date) {
    const s = input.toISOString().slice(0, 10).split('-').map(Number);
    y = s[0]; m = s[1]; d = s[2];
  } else {
    const parts = String(input).split('T')[0].split('-').map(Number);
    y = parts[0]; m = parts[1]; d = parts[2];
  }
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(Date.UTC(y, m - 1, d + 1, LOCAL_OFFSET, 0, 0, 0));
}
