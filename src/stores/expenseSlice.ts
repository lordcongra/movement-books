/**
 * Zustand Store Slice: Expense Records & Split Transactions
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import { create } from 'zustand';
import type { ExpenseRecord, SplitSegment } from '../types/expense';
import { roundCurrency, sumAmounts, validateSplitInvariant } from '../utils/currencyMath';
import { generateExpenseFingerprint } from '../utils/fingerprint';

const STORAGE_KEY = 'movement_books_expense_records_v1';

export interface ExpenseState {
  records: ExpenseRecord[];
  selectedYear: number;
  selectedCategory: string;

  // Actions
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'businessAmount' | 'personalAmount'>) => ExpenseRecord;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  removeExpense: (id: string) => void;
  clearExpenses: () => void;
  setSelectedYear: (year: number) => void;
  setSelectedCategory: (cat: string) => void;
}

function calculateSplitTotals(
  amount: number,
  isSplit: boolean,
  splits: SplitSegment[]
): { businessAmount: number; personalAmount: number } {
  const roundedTotal = roundCurrency(amount);

  if (!isSplit || splits.length === 0) {
    return {
      businessAmount: roundedTotal,
      personalAmount: 0,
    };
  }

  // Split invariant validation
  if (isSplit && splits.length > 0 && !validateSplitInvariant(splits, roundedTotal)) {
    console.warn(`Split invariant mismatch: sum of splits does not equal transaction total ($${roundedTotal})`);
  }

  const businessSplits = splits.filter((s) => s.type === 'business').map((s) => s.amount);
  const personalSplits = splits.filter((s) => s.type === 'personal').map((s) => s.amount);

  const businessAmount = sumAmounts(businessSplits);
  const personalAmount = sumAmounts(personalSplits);

  return { businessAmount, personalAmount };
}

function loadInitialExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load expense records from localStorage:', err);
    return [];
  }
}

function saveExpenses(records: ExpenseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to persist expense records to localStorage:', err);
  }
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  records: loadInitialExpenses(),
  selectedYear: 2026,
  selectedCategory: 'ALL',

  addExpense: (data) => {
    const id = generateExpenseFingerprint({
      date: data.date,
      vendor: data.vendor,
      amount: data.amount,
      description: data.description,
    });

    const { businessAmount, personalAmount } = calculateSplitTotals(
      data.amount,
      data.isSplit,
      data.splits
    );

    const newExpense: ExpenseRecord = {
      ...data,
      id,
      businessAmount,
      personalAmount,
      importedAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [newExpense, ...state.records.filter((r) => r.id !== id)];
      saveExpenses(updated);
      return { records: updated };
    });

    return newExpense;
  },

  updateExpense: (id, updates) => {
    set((state) => {
      const updated = state.records.map((item) => {
        if (item.id !== id) return item;

        const merged = { ...item, ...updates };
        const { businessAmount, personalAmount } = calculateSplitTotals(
          merged.amount,
          merged.isSplit,
          merged.splits
        );

        return {
          ...merged,
          businessAmount,
          personalAmount,
        };
      });

      saveExpenses(updated);
      return { records: updated };
    });
  },

  removeExpense: (id) => {
    set((state) => {
      const updated = state.records.filter((r) => r.id !== id);
      saveExpenses(updated);
      return { records: updated };
    });
  },

  clearExpenses: () => {
    saveExpenses([]);
    set({ records: [] });
  },

  setSelectedYear: (year) => set({ selectedYear: year }),

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
}));
