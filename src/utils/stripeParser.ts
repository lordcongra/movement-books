/**
 * Stripe Activity CSV Parser
 * Pride In Movement Physical Therapy — Financial & Tax Management
 *
 * Parses Stripe activity exports, isolates merchant processing fees,
 * and extracts them as deductible expenses automatically categorized
 * under Schedule C Line 27a: "Bank & Merchant Fees".
 */

import Papa from 'papaparse';
import type { ExpenseRecord, StripeParseResult } from '../types/expense';
import { roundCurrency, sumAmounts } from './currencyMath';
import { normalizeDate } from './dateUtils';
import { generateExpenseFingerprint } from './fingerprint';

/**
 * Finds a matching column name in raw row keys from an array of aliases.
 */
function findHeader(keys: string[], aliases: string[]): string | undefined {
  const lowerAliases = aliases.map((a) => a.toLowerCase());
  return keys.find((k) => lowerAliases.includes(k.toLowerCase().trim()));
}

/**
 * Parses numeric currency strings safely.
 */
function parseSafeAmount(val: unknown): number {
  if (typeof val === 'number') {
    return roundCurrency(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    const cleaned = trimmed.replace(/[$,()]/g, '').trim();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return roundCurrency(Math.abs(num));
  }
  return 0;
}

/**
 * Parses Stripe Activity/Balance CSV and extracts payment processing fees as deductible expenses.
 */
export function parseStripeCsv(csvContent: string): StripeParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const records: ExpenseRecord[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!parsed.data || parsed.data.length === 0) {
    return {
      records: [],
      totalParsed: 0,
      totalFees: 0,
      zeroFeeSkipped: 0,
      warnings: [],
      errors: ['Stripe CSV file is empty or could not be parsed.'],
    };
  }

  const sampleRow = parsed.data[0];
  const keys = Object.keys(sampleRow);

  const dateKey = findHeader(keys, ['Created (UTC)', 'Created', 'Date', 'Available On (UTC)']);
  const feeKey = findHeader(keys, ['Fee', 'Fees', 'Processing Fee', 'Stripe Fee']);
  const descKey = findHeader(keys, ['Description', 'Title', 'Memo', 'Type']);
  const idKey = findHeader(keys, ['id', 'Balance Transaction ID', 'Transaction ID', 'Payment Intent ID']);

  if (!feeKey) {
    errors.push('Could not detect a Stripe "Fee" column in this CSV export.');
  }
  if (!dateKey) {
    errors.push('Could not detect a Date column (expected: Created (UTC) or Date).');
  }

  if (errors.length > 0) {
    return {
      records: [],
      totalParsed: 0,
      totalFees: 0,
      zeroFeeSkipped: 0,
      warnings,
      errors,
    };
  }

  let zeroFeeSkipped = 0;
  const nowIso = new Date().toISOString();

  parsed.data.forEach((row, idx) => {
    const rawDate = row[dateKey!]?.trim() || '';
    const rawFee = row[feeKey!]?.trim() || '';
    const rawDesc = descKey ? row[descKey]?.trim() || '' : '';
    const rawId = idKey ? row[idKey]?.trim() || '' : '';

    if (!rawDate && !rawFee) {
      return;
    }

    const feeAmount = parseSafeAmount(rawFee);

    if (feeAmount <= 0) {
      zeroFeeSkipped++;
      return;
    }

    const isoDate = normalizeDate(rawDate);
    const txnDescription = rawDesc
      ? `Stripe processing fee: ${rawDesc}`
      : `Stripe processing fee (${rawId || `Txn #${idx + 1}`})`;

    const fingerprint = generateExpenseFingerprint({
      date: isoDate || rawDate,
      vendor: 'Stripe',
      amount: feeAmount,
      description: txnDescription,
    });

    const record: ExpenseRecord = {
      id: fingerprint,
      date: isoDate,
      vendor: 'Stripe',
      description: txnDescription,
      amount: feeAmount,
      isSplit: false,
      splits: [],
      category: 'Bank & Merchant Fees',
      businessAmount: feeAmount,
      personalAmount: 0,
      paymentMethod: 'Stripe',
      importedAt: nowIso,
    };

    records.push(record);
  });

  const totalFees = sumAmounts(records.map((r) => r.amount));

  return {
    records,
    totalParsed: records.length,
    totalFees,
    zeroFeeSkipped,
    warnings,
    errors,
  };
}
