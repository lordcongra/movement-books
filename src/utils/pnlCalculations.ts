/**
 * Pure Financial Math & Tax Helpers for P&L Dashboard and Schedule C
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import type { EmbodiaInvoiceRecord } from '../types/income';
import type { ExpenseRecord, ExpenseCategory } from '../types/expense';
import type {
  QuarterMetrics,
  QuarterlyPnlResult,
  MonthlyTrendItem,
  EstimatedTaxResult,
  ScheduleCExpenseLine,
} from '../types/pnl';
import {
  roundCurrency,
  toCents,
  fromCents,
  formatCurrency,
} from './currencyMath';
import {
  getYearFromDate,
  getMonthKeyFromDate,
  getQuarterFromDate,
} from './dateUtils';
import { TAX_CATEGORIES } from './taxCategories';

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Calculates total business expenses per IRS tax category with split transaction accumulation.
 * Invariant: For split transactions, each business segment is added to its specific category bucket.
 */
export function calculateCategoryExpenses(
  expenses: ExpenseRecord[]
): Record<ExpenseCategory, number> {
  const categoryCents: Partial<Record<ExpenseCategory, number>> = {};

  for (const exp of expenses) {
    if (exp.isSplit && exp.splits && exp.splits.length > 0) {
      for (const split of exp.splits) {
        if (split.type === 'business' && split.category !== 'Personal / Non-Deductible') {
          const cat = split.category as ExpenseCategory;
          const current = categoryCents[cat] || 0;
          categoryCents[cat] = current + toCents(split.amount);
        }
      }
    } else {
      if (
        exp.category !== 'Personal / Non-Deductible' &&
        exp.category !== 'Mixed / Split' &&
        exp.category !== 'Uncategorized'
      ) {
        const cat = exp.category as ExpenseCategory;
        const current = categoryCents[cat] || 0;
        categoryCents[cat] = current + toCents(exp.businessAmount);
      } else if (exp.businessAmount > 0) {
        const cat: ExpenseCategory = 'Other Business Expense';
        const current = categoryCents[cat] || 0;
        categoryCents[cat] = current + toCents(exp.businessAmount);
      }
    }
  }

  const result = {} as Record<ExpenseCategory, number>;
  for (const cat of TAX_CATEGORIES) {
    result[cat.id] = fromCents(categoryCents[cat.id] || 0);
  }
  return result;
}

/**
 * Builds Schedule C expense line items factoring in deductible rates (e.g. 50% meals).
 */
export function calculateScheduleCLines(
  categoryTotals: Record<ExpenseCategory, number>
): { lines: ScheduleCExpenseLine[]; totalDeductible: number } {
  let totalDeductibleCents = 0;

  const lines: ScheduleCExpenseLine[] = TAX_CATEGORIES.map((cat) => {
    const grossAmount = categoryTotals[cat.id] || 0;
    const deductibleAmount = roundCurrency(grossAmount * cat.defaultDeductibleRate);
    totalDeductibleCents += toCents(deductibleAmount);

    return {
      line: cat.scheduleCLine,
      category: cat.id,
      description: cat.description,
      grossAmount,
      deductibleRate: cat.defaultDeductibleRate,
      deductibleAmount,
    };
  });

  return {
    lines,
    totalDeductible: fromCents(totalDeductibleCents),
  };
}

/**
 * Computes Q1, Q2, Q3, Q4 and YTD financial summaries.
 */
export function computeQuarterlyPnl(
  incomeRecords: EmbodiaInvoiceRecord[],
  expenseRecords: ExpenseRecord[],
  year: number
): QuarterlyPnlResult {
  // Filter cash-basis income records for the selected year
  const yearIncome = incomeRecords.filter((r) => {
    const dateStr = r.paidAt || r.invoiceDate;
    return getYearFromDate(dateStr) === year && r.isCashBasisRevenue;
  });

  // Filter expenses for the selected year
  const yearExpenses = expenseRecords.filter((e) => getYearFromDate(e.date) === year);

  const quarterDefs: Array<{
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    label: string;
    months: string;
  }> = [
    { quarter: 'Q1', label: 'Q1 (Jan - Mar)', months: 'Jan - Mar' },
    { quarter: 'Q2', label: 'Q2 (Apr - Jun)', months: 'Apr - Jun' },
    { quarter: 'Q3', label: 'Q3 (Jul - Sep)', months: 'Jul - Sep' },
    { quarter: 'Q4', label: 'Q4 (Oct - Dec)', months: 'Oct - Dec' },
  ];

  let ytdRevenueCents = 0;
  let ytdExpensesCents = 0;
  let ytdVisitCount = 0;

  const quarters = quarterDefs.map(({ quarter, label, months }) => {
    const qIncome = yearIncome.filter(
      (r) => getQuarterFromDate(r.paidAt || r.invoiceDate) === quarter
    );
    const qExpenses = yearExpenses.filter((e) => getQuarterFromDate(e.date) === quarter);

    const qRevCents = qIncome.reduce((acc, r) => acc + toCents(r.totalPaid), 0);
    const qExpCents = qExpenses.reduce((acc, e) => {
      if (e.isSplit && e.splits && e.splits.length > 0) {
        const splitBizCents = e.splits
          .filter((s) => s.type === 'business' && s.category !== 'Personal / Non-Deductible')
          .reduce((sum, s) => sum + toCents(s.amount), 0);
        return acc + splitBizCents;
      }
      return acc + toCents(e.businessAmount);
    }, 0);

    const grossRevenue = fromCents(qRevCents);
    const businessExpenses = fromCents(qExpCents);
    const netProfit = roundCurrency(grossRevenue - businessExpenses);
    const profitMargin =
      grossRevenue > 0 ? roundCurrency((netProfit / grossRevenue) * 100) : 0;
    const visitCount = qIncome.length;

    ytdRevenueCents += qRevCents;
    ytdExpensesCents += qExpCents;
    ytdVisitCount += visitCount;

    return {
      quarter,
      label,
      months,
      grossRevenue,
      businessExpenses,
      netProfit,
      profitMargin,
      visitCount,
    } as QuarterMetrics;
  }) as [QuarterMetrics, QuarterMetrics, QuarterMetrics, QuarterMetrics];

  const ytdGrossRevenue = fromCents(ytdRevenueCents);
  const ytdBusinessExpenses = fromCents(ytdExpensesCents);
  const ytdNetProfit = roundCurrency(ytdGrossRevenue - ytdBusinessExpenses);
  const ytdProfitMargin =
    ytdGrossRevenue > 0 ? roundCurrency((ytdNetProfit / ytdGrossRevenue) * 100) : 0;

  return {
    year,
    quarters,
    ytd: {
      grossRevenue: ytdGrossRevenue,
      businessExpenses: ytdBusinessExpenses,
      netProfit: ytdNetProfit,
      profitMargin: ytdProfitMargin,
      visitCount: ytdVisitCount,
    },
  };
}

/**
 * Computes 12-month array (Jan–Dec) pairing monthly revenue and expenses for trend visualization.
 */
export function computeMonthlyTrends(
  incomeRecords: EmbodiaInvoiceRecord[],
  expenseRecords: ExpenseRecord[],
  year: number
): MonthlyTrendItem[] {
  const yearIncome = incomeRecords.filter((r) => {
    const d = r.paidAt || r.invoiceDate;
    return getYearFromDate(d) === year && r.isCashBasisRevenue;
  });

  const yearExpenses = expenseRecords.filter((e) => getYearFromDate(e.date) === year);

  const months: MonthlyTrendItem[] = [];

  for (let m = 1; m <= 12; m++) {
    const monthKey = String(m).padStart(2, '0');
    const monthName = MONTH_NAMES_SHORT[m - 1];

    const mIncome = yearIncome.filter((r) => {
      const d = r.paidAt || r.invoiceDate;
      return getMonthKeyFromDate(d) === monthKey;
    });

    const mExpenses = yearExpenses.filter((e) => getMonthKeyFromDate(e.date) === monthKey);

    const revCents = mIncome.reduce((acc, r) => acc + toCents(r.totalPaid), 0);
    const expCents = mExpenses.reduce((acc, e) => {
      if (e.isSplit && e.splits && e.splits.length > 0) {
        const splitBiz = e.splits
          .filter((s) => s.type === 'business' && s.category !== 'Personal / Non-Deductible')
          .reduce((sum, s) => sum + toCents(s.amount), 0);
        return acc + splitBiz;
      }
      return acc + toCents(e.businessAmount);
    }, 0);

    const revenue = fromCents(revCents);
    const expenses = fromCents(expCents);
    const netProfit = roundCurrency(revenue - expenses);
    const marginPercent = revenue > 0 ? roundCurrency((netProfit / revenue) * 100) : 0;

    months.push({
      monthIndex: m,
      monthKey,
      monthName,
      revenue,
      expenses,
      netProfit,
      marginPercent,
      visitCount: mIncome.length,
    });
  }

  return months;
}

/**
 * Computes IRS physical therapy solo practitioner estimated taxes:
 * - Net Earnings from Self-Employment = Net Profit × 92.35%
 * - Self-Employment Tax (15.3% = 12.4% Social Security + 2.9% Medicare)
 * - Estimated quarterly payment amount (SE tax / 4) paired with IRS quarterly due dates.
 */
export function computeEstimatedTax(netProfit: number, taxYear = 2026): EstimatedTaxResult {
  const safeProfit = Math.max(0, roundCurrency(netProfit));

  // 92.35% Schedule SE net earnings rate
  const seEarnings = roundCurrency(safeProfit * 0.9235);
  // 15.3% FICA / SE tax rate
  const seTaxRate = 0.153;
  const seTaxTotal = roundCurrency(seEarnings * seTaxRate);
  const quarterlyPayment = roundCurrency(seTaxTotal / 4);

  const deadlines = [
    {
      quarter: 'Q1' as const,
      dueDate: `April 15, ${taxYear}`,
      amount: quarterlyPayment,
      periodCovered: 'Jan 1 – Mar 31',
      status: 'upcoming' as const,
    },
    {
      quarter: 'Q2' as const,
      dueDate: `June 15, ${taxYear}`,
      amount: quarterlyPayment,
      periodCovered: 'Apr 1 – May 31',
      status: 'upcoming' as const,
    },
    {
      quarter: 'Q3' as const,
      dueDate: `September 15, ${taxYear}`,
      amount: quarterlyPayment,
      periodCovered: 'Jun 1 – Aug 31',
      status: 'upcoming' as const,
    },
    {
      quarter: 'Q4' as const,
      dueDate: `January 15, ${taxYear + 1}`,
      amount: quarterlyPayment,
      periodCovered: 'Sep 1 – Dec 31',
      status: 'upcoming' as const,
    },
  ];

  return {
    netProfit: safeProfit,
    seEarnings,
    seTaxRate,
    seTaxTotal,
    quarterlyPayment,
    deadlines,
  };
}

/**
 * Formats a clean, accountant-ready CSV string detailing Part I, Part II, Line 28, Line 31,
 * and estimated self-employment tax.
 */
export function generateScheduleCCsv(
  year: number,
  grossRevenue: number,
  expenseByCategory: Record<ExpenseCategory, number>,
  netProfit: number
): string {
  const { lines, totalDeductible } = calculateScheduleCLines(expenseByCategory);
  const estTax = computeEstimatedTax(netProfit, year);

  const rows: string[][] = [];

  // Helper to safely double-quote all formatted currency amounts (prevents comma-splitting in Excel/Sheets)
  const fmt = (val: number): string => `"${formatCurrency(val)}"`;

  // Header banner
  rows.push(['IRS SCHEDULE C (FORM 1040) — PRACTICE TAX SUMMARY']);
  rows.push(['Movement Books — Financial & Tax Management']);
  rows.push([`Tax Year: ${year}`, `Export Date: ${new Date().toISOString().split('T')[0]}`]);
  rows.push([]);

  // Part I — Aligned across 6 columns matching Part II (Col A: Line, Col B: Description, Col F: Amount)
  rows.push(['PART I — GROSS RECEIPTS & REVENUE (CASH BASIS)']);
  rows.push(['Line Number', 'Description', '', '', '', 'Amount']);
  rows.push(['Line 1', 'Gross receipts or sales (Cash Basis Collected Revenue)', '', '', '', fmt(grossRevenue)]);
  rows.push(['Line 3', 'Gross profit', '', '', '', fmt(grossRevenue)]);
  rows.push(['Line 7', 'Gross income', '', '', '', fmt(grossRevenue)]);
  rows.push([]);

  // Part II — 6 columns
  rows.push(['PART II — EXPENSES & PRACTICE DEDUCTIONS']);
  rows.push(['Line Number', 'Tax Category', 'Typical Practice Description', 'Gross Expense', 'Deductible Rate', 'Allowable Deduction']);

  for (const line of lines) {
    const rateLabel = `${Math.round(line.deductibleRate * 100)}%`;
    rows.push([
      line.line,
      line.category,
      `"${line.description.replace(/"/g, '""')}"`,
      fmt(line.grossAmount),
      rateLabel,
      fmt(line.deductibleAmount),
    ]);
  }

  rows.push([]);
  rows.push(['Line 28', 'Total expenses (allowable practice deductions)', '', '', '', fmt(totalDeductible)]);
  rows.push(['Line 31', 'Net profit or (loss) [Line 7 minus Line 28]', '', '', '', fmt(netProfit)]);
  rows.push([]);

  // Schedule SE & Estimated Tax Guidance — Aligned across 6 columns
  rows.push(['SCHEDULE SE — SELF-EMPLOYMENT TAX GUIDANCE (SOLO PRACTITIONER)']);
  rows.push(['Line Number', 'Description', '', '', '', 'Amount']);
  rows.push(['Line 4', 'Net earnings from self-employment (Net profit × 92.35%)', '', '', '', fmt(estTax.seEarnings)]);
  rows.push(['Line 5', 'Self-employment tax (15.3% = 12.4% OASDI + 2.9% HI)', '', '', '', fmt(estTax.seTaxTotal)]);
  rows.push(['Line 6', 'Deduction for one-half of self-employment tax (50%)', '', '', '', fmt(roundCurrency(estTax.seTaxTotal / 2))]);
  rows.push([]);

  // Estimated Safe Harbor Quarterly Payments
  rows.push(['IRS ESTIMATED SAFE-HARBOR QUARTERLY TAX PAYMENTS']);
  rows.push(['Quarter', 'Filing Due Date', 'Period Covered', 'Recommended Set-Aside']);
  for (const dl of estTax.deadlines) {
    rows.push([dl.quarter, dl.dueDate, `"${dl.periodCovered}"`, fmt(dl.amount)]);
  }

  // Safe CSV escaping helper
  const escapeCell = (cell: string): string => {
    if (!cell) return '';
    if (cell.startsWith('"') && cell.endsWith('"')) return cell;
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  return rows.map((r) => r.map(escapeCell).join(',')).join('\r\n');
}
