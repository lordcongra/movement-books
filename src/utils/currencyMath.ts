/**
 * Cents-Safe Precision Math Helpers
 * Ensures financial arithmetic avoids JavaScript floating-point errors.
 */

/**
 * Rounds a dollar number to 2 decimal places safely via integer cents.
 */
export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a dollar amount to integer cents.
 */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100);
}

/**
 * Converts integer cents back to dollar amount with 2 decimals.
 */
export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return roundCurrency(cents / 100);
}

/**
 * Sums an array of dollar amounts with zero floating-point accumulation error.
 */
export function sumAmounts(amounts: number[]): number {
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

/**
 * Validates that the sum of split segments strictly equals the original total.
 */
export function validateSplitInvariant(
  splits: { amount: number }[],
  total: number
): boolean {
  const sumCents = splits.reduce((acc, curr) => acc + toCents(curr.amount), 0);
  return sumCents === toCents(total);
}

/**
 * Computes the remaining unallocated dollar amount for a split transaction.
 */
export function calculateSplitRemainder(
  splits: { amount: number }[],
  total: number
): number {
  const totalCents = toCents(total);
  const splitsCents = splits.reduce((acc, curr) => acc + toCents(curr.amount), 0);
  return fromCents(totalCents - splitsCents);
}

/**
 * Formats a monetary number into standard US currency: $1,234.56
 */
export function formatCurrency(
  amount: number,
  options?: { hideZeroCents?: boolean; showPlusSign?: boolean }
): string {
  const safeVal = roundCurrency(amount);
  const isNegative = safeVal < 0;
  const absVal = Math.abs(safeVal);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.hideZeroCents && absVal % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absVal);

  if (isNegative) {
    return `-${formatted}`;
  }
  if (options?.showPlusSign && safeVal > 0) {
    return `+${formatted}`;
  }
  return formatted;
}
