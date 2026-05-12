/**
 * Format an ISO date string (YYYY-MM-DD) to DD/MM/YYYY format.
 * @param iso ISO date string in format YYYY-MM-DD
 * @returns Date string in format DD/MM/YYYY
 */
export function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

