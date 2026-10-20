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
import { extractEmbeddedDate, normalizeDate } from './dateUtils';
import { generateExpenseFingerprint } from './fingerprint';

export interface StripeParseOptions {
  filename?: string;
  defaultYear?: number;
}

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
 * Extracts a date from a filename using embedded date patterns or month/year fallback,
 * defaulting to Dec 31 of defaultYear.
 */
function getItemizedReportDate(filename?: string, defaultYear: number = 2026): string {
  if (filename) {
    const extracted = extractEmbeddedDate(filename, defaultYear);
    if (extracted) return extracted;

    // Month name with 4-digit year: "January 2026", "Jan-2026", "stripe_fee_january_2026.csv"
    const monthYearMatch = filename.match(
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[^\w\d]*(\d{4})\b/i
    );
    if (monthYearMatch) {
      const norm = normalizeDate(`${monthYearMatch[1]} 1, ${monthYearMatch[2]}`);
      if (norm) return norm;
    }

    // 4-digit year with month name: "2026_January", "2026-Jan"
    const yearMonthMatch = filename.match(
      /\b(\d{4})[^\w\d]*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i
    );
    if (yearMonthMatch) {
      const norm = normalizeDate(`${yearMonthMatch[2]} 1, ${yearMonthMatch[1]}`);
      if (norm) return norm;
    }

    // ISO Year-Month: "2026-01", "2026_01"
    const isoYearMonthMatch = filename.match(/\b(\d{4})[-_](0?[1-9]|1[0-2])\b/);
    if (isoYearMonthMatch) {
      const y = isoYearMonthMatch[1];
      const m = isoYearMonthMatch[2].padStart(2, '0');
      return `${y}-${m}-01`;
    }
  }

  return `${defaultYear || 2026}-12-31`;
}

/**
 * Parses Stripe Activity/Balance CSV or Itemized Fee CSV and extracts merchant processing fees as deductible expenses.
 */
export function parseStripeCsv(csvContent: string, options: StripeParseOptions = {}): StripeParseResult {
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

  const featureNameKey = findHeader(keys, ['feature_name', 'Feature Name', 'feature']);
  const isItemizedFee = Boolean(featureNameKey);

  let zeroFeeSkipped = 0;
  const nowIso = new Date().toISOString();

  if (isItemizedFee) {
    const amountKey = findHeader(keys, ['amount', 'Amount', 'fee', 'Fees', 'Fee']);
    const featureDescKey = findHeader(keys, ['feature_description', 'Feature Description', 'description', 'Description']);
    const productKey = findHeader(keys, ['product', 'Product']);

    if (!amountKey) {
      errors.push('Could not detect an Amount or Fee column in this Stripe itemized fee report.');
      return {
        records: [],
        totalParsed: 0,
        totalFees: 0,
        zeroFeeSkipped: 0,
        warnings,
        errors,
      };
    }

    const itemizedDate = getItemizedReportDate(options.filename, options.defaultYear || 2026);

    parsed.data.forEach((row, idx) => {
      const rawAmount = row[amountKey]?.trim() || '';
      if (!rawAmount) return;

      const feeAmount = parseSafeAmount(rawAmount);
      if (feeAmount <= 0) {
        zeroFeeSkipped++;
        return;
      }

      const featureName = featureNameKey ? row[featureNameKey]?.trim() || '' : '';
      const featureDesc = featureDescKey ? row[featureDescKey]?.trim() || '' : '';
      const product = productKey ? row[productKey]?.trim() || '' : '';

      let txnDescription = '';
      if (featureName && featureDesc && featureDesc.toLowerCase() !== featureName.toLowerCase()) {
        txnDescription = `Stripe Fee: ${featureName} (${featureDesc})`;
      } else if (featureName) {
        txnDescription = `Stripe Fee: ${featureName}`;
      } else if (featureDesc) {
        txnDescription = `Stripe Fee: ${featureDesc}`;
      } else if (product) {
        txnDescription = `Stripe Fee: ${product}`;
      } else {
        txnDescription = `Stripe Itemized Fee #${idx + 1}`;
      }

      const fingerprint = generateExpenseFingerprint({
        date: itemizedDate,
        vendor: 'Stripe',
        amount: feeAmount,
        description: txnDescription,
      });

      const record: ExpenseRecord = {
        id: fingerprint,
        date: itemizedDate,
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
  } else {
    // Standard Stripe Activity CSV
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
  }

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
