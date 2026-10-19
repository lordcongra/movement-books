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
