/**
 * Deterministic Fingerprinting & Hash Generator
 * Detects duplicates without relying on mutable array indexes or timestamps.
 */

/**
 * 64-bit FNV-1a hash algorithm returning a 16-character hexadecimal string.
 * Completely deterministic across browsers and environments.
 */
export function hashString(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x5a5a5a5a;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch >> 1), 0x01000193);
  }

  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`;
}

/**
 * Generates a deterministic record hash for Embodia invoice records.
 */
export function generateEmbodiaFingerprint(fields: {
  invoiceDate?: string;
  invoiceNumber?: string;
  patient?: string;
  description?: string;
  totalPaid?: number | string;
  paidAt?: string;
  total?: number | string;
}): string {
  const normDate = (fields.invoiceDate || '').trim();
  const normInvNum = (fields.invoiceNumber || '').trim();
  const normPat = (fields.patient || '').trim().toLowerCase();
  const normDesc = (fields.description || '').trim().toLowerCase();
  const normPaid = String(fields.totalPaid ?? '0').trim();
  const normPaidAt = (fields.paidAt || '').trim();
  const normTotal = String(fields.total ?? '0').trim();

  const rawSeed = [
    normInvNum,
    normDate,
    normPaidAt,
    normDesc,
    normPat,
    normPaid,
    normTotal,
  ].join('|');

  return `emb_${hashString(rawSeed)}`;
}

/**
 * Generates a deterministic record hash for Expenses.
 */
export function generateExpenseFingerprint(fields: {
  date: string;
  vendor: string;
  amount: number | string;
  description?: string;
}): string {
  const normDate = (fields.date || '').trim();
  const normVendor = (fields.vendor || '').trim().toLowerCase();
  const normAmount = String(fields.amount ?? '0').trim();
  const normDesc = (fields.description || '').trim().toLowerCase();

  const rawSeed = [normDate, normVendor, normAmount, normDesc].join('|');
  return `exp_${hashString(rawSeed)}`;
}
