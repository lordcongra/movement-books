/**
 * Profit & Loss and Financial Summary Data Types
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import type { PaymentMethod, VisitCategory } from './income';
import type { ExpenseCategory } from './expense';

export interface PnlPeriodSummary {
  periodKey: string; // e.g. "2026-01", "2026-Q1", "2026"
  label: string; // e.g. "January 2026", "Q1 2026", "2026 YTD"
  grossRevenue: number; // Cash basis total paid
  totalInvoiced: number;
  businessExpenses: number;
  netIncome: number;
  visitCount: number;
  evaluationCount: number;
  followUpCount: number;
  dryNeedlingCount: number;
  cancellationCount: number;
  revenueByCategory: Record<VisitCategory, number>;
  revenueByPaymentMethod: Record<PaymentMethod, number>;
  expensesByCategory: Partial<Record<ExpenseCategory, number>>;
}

export interface PnlYearSummary {
  year: number;
  monthly: Record<string, PnlPeriodSummary>; // keyed by "01", "02", etc.
  quarterly: Record<string, PnlPeriodSummary>; // keyed by "Q1", "Q2", "Q3", "Q4"
  ytd: PnlPeriodSummary;
}

export interface QuarterMetrics {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  label: string; // e.g. "Q1 (Jan - Mar)"
  months: string; // e.g. "Jan - Mar"
  grossRevenue: number;
  businessExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage, e.g. 68.4
  visitCount: number;
}

export interface QuarterlyPnlResult {
  year: number;
  quarters: [QuarterMetrics, QuarterMetrics, QuarterMetrics, QuarterMetrics];
  ytd: {
    grossRevenue: number;
    businessExpenses: number;
    netProfit: number;
    profitMargin: number;
    visitCount: number;
  };
}

export interface MonthlyTrendItem {
  monthIndex: number; // 1 - 12
  monthKey: string; // "01" - "12"
  monthName: string; // "Jan", "Feb", ...
  revenue: number;
  expenses: number;
  netProfit: number;
  marginPercent: number;
  visitCount: number;
}

export interface TaxDeadlineItem {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  dueDate: string; // e.g. "April 15, 2026"
  amount: number;
  periodCovered: string; // e.g. "Jan 1 – Mar 31"
  status: 'upcoming' | 'past' | 'current';
}

export interface EstimatedTaxResult {
  netProfit: number;
  seEarnings: number; // Net Profit * 0.9235
  seTaxRate: number; // 0.153 (15.3%)
  seTaxTotal: number; // seEarnings * 0.153
  quarterlyPayment: number; // seTaxTotal / 4
  deadlines: TaxDeadlineItem[];
}

export interface ScheduleCExpenseLine {
  line: string;
  category: ExpenseCategory;
  description: string;
  grossAmount: number;
  deductibleRate: number;
  deductibleAmount: number;
}
