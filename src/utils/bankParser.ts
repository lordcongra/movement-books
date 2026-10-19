/**
 * Bank Statement CSV Parser
 * Pride In Movement Physical Therapy — Financial & Tax Management
 *
 * Auto-detects variable bank export headers (Date, Description, Debit/Credit vs single Amount),
 * filters out deposits/inflows, auto-categorizes PT practice expenses, and generates
 * deterministic deduplication fingerprints.
 */

import Papa from 'papaparse';
import type { BankParseResult, ExpenseCategory, ExpenseRecord } from '../types/expense';
import { roundCurrency, sumAmounts } from './currencyMath';
import { normalizeDate } from './dateUtils';
import { generateExpenseFingerprint } from './fingerprint';

/**
 * Keyword-based rules to auto-assign IRS Schedule C categories for physical therapy practices.
 */
interface CategoryRule {
  category: ExpenseCategory;
  keywords: string[];
}

const PT_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Rent / Clinical Space',
    keywords: ['rent', 'sublease', 'clinical space', 'studio lease', 'gym lease', 'facility fee'],
  },
  {
    category: 'Utilities & Phone',
    keywords: ['verizon', 'at&t', 't-mobile', 'sprint', 'comcast', 'spectrum', 'internet', 'wireless', 'phone plan', 'electric', 'utility'],
  },
  {
    category: 'Continuing Education & Training',
    keywords: ['medbridge', 'apta', 'ceu', 'continuing ed', 'education', 'seminar', 'webinar', 'course', 'dry needling course', 'cert dn', 'conference', 'institute'],
  },
  {
    category: 'Office Expense & Supplies',
    keywords: ['lhasa', 'seirin', 'optp', 'performance health', 'supplies', 'needles', 'sharps', 'wipes', 'sanitizer', 'massage cream', 'band', 'stationery', 'amazon', 'target', 'staples', 'walmart'],
  },
  {
    category: 'Software & Subscriptions',
    keywords: ['google', 'workspace', 'zoom', 'embodia', 'quickbooks', 'intuit', 'jane app', 'squarespace', 'webflow', 'adobe', 'dropbox', 'docusign', 'canva', 'mailchimp', 'software', 'subscription'],
  },
  {
    category: 'Liability & Malpractice Insurance',
    keywords: ['hpso', 'malpractice', 'liability insurance', 'cna insurance', 'hiscox', 'insurance premium', 'commercial insurance'],
  },
  {
    category: 'Licenses, Certifications & Dues',
    keywords: ['board of pt', 'pt board', 'state board', 'licensing', 'license renewal', 'apta dues', 'dues', 'certification', 'cpr renewal', 'bls', 'red cross'],
  },
  {
    category: 'Bank & Merchant Fees',
    keywords: ['bank fee', 'monthly fee', 'maintenance fee', 'service charge', 'wire fee', 'overdraft', 'analysis fee', 'merchant fee', 'stripe fee'],
  },
  {
    category: 'Professional Services & Legal',
    keywords: ['cpa', 'accountant', 'accounting', 'legal', 'attorney', 'law office', 'bookkeep', 'tax prep', 'llc annual'],
  },
  {
    category: 'Equipment & Furnishings',
    keywords: ['treatment table', 'clinton industries', 'hi-lo', 'dynamometer', 'rogue', 'barbell', 'kettlebell', 'weights', 'exercise machine', 'furnishing'],
  },
  {
    category: 'Travel & Mileage',
    keywords: ['shell', 'chevron', 'exxon', 'mobil', 'bp', 'gas', 'fuel', 'parking', 'toll', 'ezpass', 'hotel', 'airline', 'flight', 'airbnb', 'uber', 'lyft'],
  },
  {
    category: 'Meals (Tax Deductible)',
    keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'diner', 'bistro', 'panera', 'lunch', 'dinner'],
  },
  {
    category: 'Advertising & Marketing',
    keywords: ['adwords', 'google ads', 'facebook ads', 'meta ads', 'marketing', 'flyers', 'vista print', 'print', 'sponsor'],
  },
];

/**
 * Assigns an expense category based on matching keywords in vendor and description.
 */
export function categorizeBankTransaction(
  vendor: string,
  description: string
): ExpenseCategory | 'Uncategorized' {
  const combined = `${vendor} ${description}`.toLowerCase();

  for (const rule of PT_CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) {
        return rule.category;
      }
    }
  }

  return 'Uncategorized';
}

/**
 * Parses numeric currency strings safely, handling parentheses for negatives and dollar signs.
 */
function parseSafeAmount(val: unknown): number {
  if (typeof val === 'number') {
    return roundCurrency(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    // Handle (120.00) format as negative
    const isParenNegative = trimmed.startsWith('(') && trimmed.endsWith(')');
    const cleaned = trimmed.replace(/[$,()]/g, '').trim();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return roundCurrency(isParenNegative ? -Math.abs(num) : num);
  }
  return 0;
}

/**
 * Normalizes vendor name from bank transaction description.
 */
function extractVendor(description: string): string {
  if (!description) return 'Unknown Vendor';
  let cleaned = description.trim();

  // Strip common bank transaction prefixes
  cleaned = cleaned.replace(/^(POS\s+DEBIT|CHECKCARD|PURCHASE|DEBIT\s+CARD|ACH\s+DEBIT|ELECTRONIC\s+WITHDRAWAL)\s*[-:]?\s*/i, '');
  // Strip trailing bank details like card numbers #1234 or dates
  cleaned = cleaned.replace(/\s+#\d+.*$/i, '');

  return cleaned.trim() || description.trim();
}

/**
 * Finds a matching column name in raw row keys from an array of aliases (case-insensitive).
 */
function findHeader(keys: string[], aliases: string[]): string | undefined {
  const lowerAliases = aliases.map((a) => a.toLowerCase());
  return keys.find((k) => lowerAliases.includes(k.toLowerCase().trim()));
}

/**
 * Parses bank statement CSV text and extracts expense records.
 */
export function parseBankCsv(csvContent: string): BankParseResult {
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

  const sampleRow = parsed.data[0];
  const keys = Object.keys(sampleRow);

  // Column detection
  const dateKey = findHeader(keys, ['Posting Date', 'Date', 'Transaction Date', 'Post Date', 'Trans Date']);
  const descKey = findHeader(keys, ['Description', 'Payee', 'Merchant', 'Name', 'Memo', 'Transaction Description']);
  const debitKey = findHeader(keys, ['Debit', 'Debits', 'Withdrawal', 'Withdrawals']);
  const creditKey = findHeader(keys, ['Credit', 'Credits', 'Deposit', 'Deposits']);
  const amountKey = findHeader(keys, ['Amount', 'Total Amount', 'Net Amount']);
  const typeKey = findHeader(keys, ['Type', 'Transaction Type']);

  if (!dateKey) {
    errors.push('Could not detect a Date column (expected: Date, Posting Date, or Transaction Date).');
  }
  if (!descKey) {
    errors.push('Could not detect a Description or Payee column.');
  }
  if (!debitKey && !amountKey) {
    errors.push('Could not detect an Amount or Debit column.');
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

  parsed.data.forEach((row, idx) => {
    const rawDate = row[dateKey!]?.trim() || '';
    const rawDesc = row[descKey!]?.trim() || '';
    const rawType = typeKey ? row[typeKey]?.trim().toLowerCase() : '';

    if (!rawDate && !rawDesc) {
      return;
    }

    const isoDate = normalizeDate(rawDate);
    let expenseAmount = 0;
    let isDeposit = false;

    // Strategy 1: Separate Debit and Credit columns
    if (debitKey || creditKey) {
      const debitVal = debitKey ? parseSafeAmount(row[debitKey]) : 0;
      const creditVal = creditKey ? parseSafeAmount(row[creditKey]) : 0;

      if (creditVal > 0) {
        isDeposit = true;
      } else if (debitVal > 0) {
        expenseAmount = Math.abs(debitVal);
      } else if (amountKey) {
        const amtVal = parseSafeAmount(row[amountKey]);
        if (amtVal < 0) {
          expenseAmount = Math.abs(amtVal);
        } else if (amtVal > 0) {
          isDeposit = true;
        }
      }
    } else if (amountKey) {
      // Strategy 2: Single signed Amount column
      const amtVal = parseSafeAmount(row[amountKey]);

      if (rawType.includes('credit') || rawType.includes('deposit')) {
        isDeposit = true;
      } else if (rawType.includes('debit') || rawType.includes('withdrawal') || rawType.includes('check')) {
        expenseAmount = Math.abs(amtVal);
      } else if (amtVal < 0) {
        // Negative amount represents an outflow / expense
        expenseAmount = Math.abs(amtVal);
      } else if (amtVal > 0) {
        // Positive amount without explicit debit indicator is a deposit
        isDeposit = true;
      }
    }

    if (isDeposit) {
      depositsSkipped++;
      return;
    }

    if (expenseAmount <= 0) {
      warnings.push(`Row ${idx + 2}: Zero or unparseable expense amount for "${rawDesc}". Skipped.`);
      return;
    }

    const vendor = extractVendor(rawDesc);
    const category = categorizeBankTransaction(vendor, rawDesc);

    const fingerprint = generateExpenseFingerprint({
      date: isoDate || rawDate,
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
      businessAmount: expenseAmount,
      personalAmount: 0,
      paymentMethod: 'Bank Account / Debit',
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
