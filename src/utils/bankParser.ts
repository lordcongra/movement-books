/**
 * Bank Statement & Google Sheets Expense CSV Parser
 * Pride In Movement Physical Therapy — Financial & Tax Management
 *
 * Supports Bank Statement CSVs (debit/credit or signed Amount), Stripe fee exports,
 * and Google Sheets expense/food logs (Cost ($), Price, Total, in-name dates).
 * Deterministic deduplication, zero external network transmission.
 */

import Papa from 'papaparse';
import type { BankParseResult, ExpenseCategory, ExpenseRecord } from '../types/expense';
import { roundCurrency, sumAmounts } from './currencyMath';
import { extractEmbeddedDate, normalizeDate } from './dateUtils';
import { categorizeBankTransaction, mapUserCategory } from './expenseCategorizer';
import { generateExpenseFingerprint } from './fingerprint';

// Re-export categorization helpers for external modules
export { categorizeBankTransaction, mapUserCategory };

export interface BankParseOptions {
  filename?: string;
  defaultYear?: number;
}

/**
 * Parses numeric currency strings safely, handling parentheses, currency symbols, and spaces.
 */
export function parseSafeAmount(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : roundCurrency(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    // Handle (120.00) or ($120.00) format as negative
    const isParenNegative = trimmed.startsWith('(') && trimmed.endsWith(')');
    const cleaned = trimmed.replace(/[^0-9.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return roundCurrency(isParenNegative ? -Math.abs(num) : num);
  }
  return 0;
}

/**
 * Normalizes vendor name from bank transaction description, stripping dates and prefixes.
 */
function extractVendor(description: string): string {
  if (!description) return 'Unknown Vendor';
  let cleaned = description.trim();

  // Strip common bank transaction prefixes
  cleaned = cleaned.replace(/^(POS\s+DEBIT|CHECKCARD|PURCHASE|DEBIT\s+CARD|ACH\s+DEBIT|ELECTRONIC\s+WITHDRAWAL)\s*[-:]?\s*/i, '');
  // Strip trailing bank details like card numbers #1234
  cleaned = cleaned.replace(/\s+#\d+.*$/i, '');
  // Strip leading embedded date if present (e.g. "01/06/2026 Panera Bread" -> "Panera Bread")
  cleaned = cleaned.replace(/^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*[-:]?\s*/i, '');
  // Strip trailing embedded date if present (e.g. "Panera Bread 01/06/2026" -> "Panera Bread")
  cleaned = cleaned.replace(/\s*[-:]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})$/i, '');

  return cleaned.trim() || description.trim();
}

/**
 * Finds a matching column name in raw row keys from an array of aliases (case-insensitive).
 */
function findHeader(keys: string[], aliases: string[]): string | undefined {
  const lowerAliases = aliases.map((a) => a.toLowerCase().trim());
  return keys.find((k) => lowerAliases.includes(k.toLowerCase().trim()));
}

/**
 * Parses bank statement CSV text or Google Sheets expense/food logs.
 */
export function parseBankCsv(csvContent: string, options?: BankParseOptions): BankParseResult {
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
      totalExpenseAmount: 0,
      depositsSkipped: 0,
      warnings: [],
      errors: ['CSV file is empty or could not be parsed.'],
    };
  }

  const filename = options?.filename || '';
  const isFoodFile = /food|meal/i.test(filename);
  const activeYear = options?.defaultYear || 2026;

  const sampleRow = parsed.data[0];
  const keys = Object.keys(sampleRow);

  // Column detection with expanded Google Sheets aliases
  const dateKey = findHeader(keys, [
    'Posting Date', 'Date', 'Transaction Date', 'Post Date', 'Trans Date', 'Purchase Date', 'Expense Date',
  ]);
  const descKey = findHeader(keys, [
    'Description', 'Payee', 'Merchant', 'Name', 'Item', 'Item Name', 'Title', 'Details', 'Memo', 'Transaction Description',
  ]);
  const categoryKey = findHeader(keys, [
    'Category', 'Expense Category', 'Tax Category', 'Class', 'Classification',
  ]);
  const debitKey = findHeader(keys, [
    'Cost ($)', 'Cost', 'Cost($)', 'Cost (USD)', 'Price', 'Price ($)', 'Total', 'Total ($)',
    'Expense', 'Expenses', 'Debit', 'Debits', 'Withdrawal', 'Withdrawals',
  ]);
  const creditKey = findHeader(keys, ['Credit', 'Credits', 'Deposit', 'Deposits']);
  const amountKey = findHeader(keys, ['Amount', 'Total Amount', 'Net Amount']);
  const typeKey = findHeader(keys, ['Type', 'Transaction Type', 'Trans Type']);

  if (!descKey) {
    errors.push('Could not detect a Description, Name, or Payee column.');
  }
  if (!debitKey && !amountKey) {
    errors.push('Could not detect an Amount, Cost, Price, Total, or Debit column.');
  }

  if (errors.length > 0) {
    return {
      records: [],
      totalParsed: 0,
      totalExpenseAmount: 0,
      depositsSkipped: 0,
      warnings,
      errors,
    };
  }

  let depositsSkipped = 0;
  const nowIso = new Date().toISOString();

  parsed.data.forEach((row) => {
    const rawDate = dateKey ? (row[dateKey]?.trim() || '') : '';
    const rawDesc = descKey ? (row[descKey]?.trim() || '') : '';
    const rawType = typeKey ? (row[typeKey]?.trim().toLowerCase() || '') : '';

    // Filter completely empty rows
    if (!rawDesc && !rawDate && (!debitKey || !row[debitKey]) && (!amountKey || !row[amountKey])) {
      return;
    }

    let expenseAmount = 0;
    let isDeposit = false;

    // Check Credit / Deposit columns first
    if (creditKey) {
      const creditVal = parseSafeAmount(row[creditKey]);
      if (creditVal > 0) {
        isDeposit = true;
      }
    }

    // Strategy 1: Debit / Cost / Price / Total / Expense column
    if (!isDeposit && debitKey) {
      const debitVal = parseSafeAmount(row[debitKey]);
      if (debitVal !== 0) {
        expenseAmount = Math.abs(debitVal);
      }
    }

    // Strategy 2: Single signed Amount column fallback
    if (!isDeposit && expenseAmount === 0 && amountKey) {
      const amtVal = parseSafeAmount(row[amountKey]);

      if (rawType.includes('credit') || rawType.includes('deposit')) {
        isDeposit = true;
      } else if (rawType.includes('debit') || rawType.includes('withdrawal') || rawType.includes('check')) {
        expenseAmount = Math.abs(amtVal);
      } else if (amtVal < 0) {
        expenseAmount = Math.abs(amtVal);
      } else if (amtVal > 0) {
        if (isFoodFile) {
          expenseAmount = amtVal;
        } else {
          isDeposit = true;
        }
      }
    }

    if (isDeposit) {
      depositsSkipped++;
      return;
    }

    // Filter out blank rows or items with zero/empty amounts (e.g. "Tablecloth")
    if (expenseAmount <= 0) {
      return;
    }

    // Resolve date: dedicated column -> in-name regex extraction -> fallback to active tax year
    let isoDate = '';
    if (rawDate) {
      isoDate = normalizeDate(rawDate);
    }

    if (!isoDate) {
      const extracted = extractEmbeddedDate(rawDesc, activeYear);
      isoDate = extracted || `${activeYear}-01-01`;
    }

    const vendor = extractVendor(rawDesc);

    // Resolve category:
    // If it is a dedicated food/meals file (e.g. "Food Costs.csv", "Food.csv", "Meals.csv"),
    // auto-tag all expenses as 'Meals (Tax Deductible)' unless explicitly marked Personal.
    let category: ExpenseCategory | 'Personal / Non-Deductible' | 'Uncategorized';
    let mappedCategory: ExpenseCategory | 'Personal / Non-Deductible' | null = null;
    if (categoryKey && row[categoryKey]) {
      mappedCategory = mapUserCategory(row[categoryKey]);
    }

    if (isFoodFile) {
      category = mappedCategory === 'Personal / Non-Deductible'
        ? 'Personal / Non-Deductible'
        : 'Meals (Tax Deductible)';
    } else if (mappedCategory) {
      category = mappedCategory;
    } else {
      const keywordCat = categorizeBankTransaction(vendor, rawDesc);
      if (keywordCat !== 'Uncategorized') {
        category = keywordCat;
      } else {
        category = 'Uncategorized';
      }
    }

    const isPersonal = category === 'Personal / Non-Deductible';
    const businessAmount = isPersonal ? 0 : expenseAmount;
    const personalAmount = isPersonal ? expenseAmount : 0;

    const fingerprint = generateExpenseFingerprint({
      date: isoDate,
      vendor,
      amount: expenseAmount,
      description: rawDesc,
    });

    const record: ExpenseRecord = {
      id: fingerprint,
      date: isoDate,
      vendor,
      description: rawDesc,
      amount: expenseAmount,
      isSplit: false,
      splits: [],
      category,
      businessAmount,
      personalAmount,
      paymentMethod: isFoodFile ? 'Food & Expense Log' : 'Bank Account / Debit',
      importedAt: nowIso,
    };

    records.push(record);
  });

  const totalExpenseAmount = sumAmounts(records.map((r) => r.amount));

  return {
    records,
    totalParsed: records.length,
    totalExpenseAmount,
    depositsSkipped,
    warnings,
    errors,
  };
}
