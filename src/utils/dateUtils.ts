/**
 * Date Parsing and Formatting Utilities for Embodia and Financial Records
 */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTH_MAP: Record<string, string> = {
  january: '01',
  jan: '01',
  february: '02',
  feb: '02',
  march: '03',
  mar: '03',
  april: '04',
  apr: '04',
  may: '05',
  june: '06',
  jun: '06',
  july: '07',
  jul: '07',
  august: '08',
  aug: '08',
  september: '09',
  sep: '09',
  sept: '09',
  october: '10',
  oct: '10',
  november: '11',
  nov: '11',
  december: '12',
  dec: '12',
};

/**
 * Normalizes any Embodia or user-provided date string into ISO YYYY-MM-DD.
 * Handles "January 5, 2026", "2026-01-05", "01/05/2026", etc.
 */
export function normalizeDate(rawDate?: string | null): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (!trimmed) return '';

  // Already ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Format: "Month DD, YYYY" e.g., "January 5, 2026"
  const monthNameMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthNameMatch) {
    const [, monthStr, dayStr, yearStr] = monthNameMatch;
    const monthNum = MONTH_MAP[monthStr.toLowerCase()];
    if (monthNum) {
      const day = dayStr.padStart(2, '0');
      return `${yearStr}-${monthNum}-${day}`;
    }
  }

  // Format: MM/DD/YYYY or M/D/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback to JS Date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Formats an ISO YYYY-MM-DD string into a clean display date: "Jan 5, 2026".
 */
export function formatDisplayDate(isoDate?: string | null): string {
  if (!isoDate) return '—';
  const norm = normalizeDate(isoDate);
  if (!norm) return isoDate || '—';

  const [y, m, d] = norm.split('-').map(Number);
  if (!y || !m || !d) return isoDate;

  const monthIdx = m - 1;
  const monthName = MONTH_NAMES[monthIdx] ? MONTH_NAMES[monthIdx].slice(0, 3) : '';
  return `${monthName} ${d}, ${y}`;
}

/**
 * Extracts the 4-digit year from an ISO date or raw date string.
 */
export function getYearFromDate(dateStr?: string | null): number {
  const norm = normalizeDate(dateStr);
  if (norm) {
    const y = parseInt(norm.substring(0, 4), 10);
    if (!isNaN(y)) return y;
  }
  return new Date().getFullYear();
}

/**
 * Extracts month key "01" through "12" from an ISO date string.
 */
export function getMonthKeyFromDate(dateStr?: string | null): string {
  const norm = normalizeDate(dateStr);
  if (norm && norm.length >= 7) {
    return norm.substring(5, 7);
  }
  return '01';
}

/**
 * Returns the calendar quarter: "Q1" | "Q2" | "Q3" | "Q4".
 */
export function getQuarterFromDate(dateStr?: string | null): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const monthKey = getMonthKeyFromDate(dateStr);
  const m = parseInt(monthKey, 10);
  if (m >= 1 && m <= 3) return 'Q1';
  if (m >= 4 && m <= 6) return 'Q2';
  if (m >= 7 && m <= 9) return 'Q3';
  return 'Q4';
}

/**
 * Returns month full name from 1-12 or key "01"-"12".
 */
export function getMonthName(month: number | string): string {
  const idx = typeof month === 'string' ? parseInt(month, 10) - 1 : month - 1;
  return MONTH_NAMES[idx] ?? 'Unknown';
}
