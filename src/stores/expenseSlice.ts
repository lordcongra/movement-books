/**
 * Zustand Store Slice: Expense Records & Split Transactions
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import { create } from 'zustand';
import type { ExpenseRecord, SplitSegment } from '../types/expense';
import { roundCurrency, sumAmounts, validateSplitInvariant } from '../utils/currencyMath';
import { generateExpenseFingerprint } from '../utils/fingerprint';

const STORAGE_KEY = 'movement_books_expense_records_v1';
const SELECTED_YEAR_KEY = 'movement_books_expense_selected_year_v1';

export interface AddExpensesResult {
  added: number;
  duplicates: number;
  updated: number;
}

export interface ExpenseState {
  records: ExpenseRecord[];
  selectedYear: number;
  selectedCategory: string;

  // Actions
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'businessAmount' | 'personalAmount'> & { id?: string }) => ExpenseRecord;
  addExpenses: (newExpenses: ExpenseRecord[]) => AddExpensesResult;
  mergeExpenses: (records: ExpenseRecord[]) => AddExpensesResult;
  restoreExpenses: (records: ExpenseRecord[]) => void;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  removeExpense: (id: string) => void;
  clearExpenses: () => void;
  setSelectedYear: (year: number) => void;
  setSelectedCategory: (cat: string) => void;
}

export function calculateSplitTotals(
  amount: number,
  isSplit: boolean,
  splits: SplitSegment[],
  category?: string
): { businessAmount: number; personalAmount: number } {
  const roundedTotal = roundCurrency(amount);

  if (!isSplit || splits.length === 0) {
    if (category === 'Personal / Non-Deductible') {
      return {
        businessAmount: 0,
        personalAmount: roundedTotal,
      };
    }
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

function loadInitialYear(): number {
  try {
    const raw = localStorage.getItem(SELECTED_YEAR_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // Fall back to current year
  }
  return 2026;
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
  selectedYear: loadInitialYear(),
  selectedCategory: 'ALL',

  addExpense: (data) => {
    const id = data.id || generateExpenseFingerprint({
      date: data.date,
      vendor: data.vendor,
      amount: data.amount,
      description: data.description,
    });

    const { businessAmount, personalAmount } = calculateSplitTotals(
      data.amount,
      data.isSplit,
      data.splits || [],
      data.category
    );

    const newExpense: ExpenseRecord = {
      ...data,
      id,
      splits: data.splits || [],
      businessAmount,
      personalAmount,
      importedAt: data.importedAt || new Date().toISOString(),
    };

    set((state) => {
      const filtered = state.records.filter((r) => r.id !== id);
      const updated = [newExpense, ...filtered];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      saveExpenses(updated);
      return { records: updated };
    });

    return newExpense;
  },

  addExpenses: (newExpenses) => {
    let addedCount = 0;
    let duplicateCount = 0;
    let updatedCount = 0;

    set((state) => {
      const existingMap = new Map(state.records.map((r) => [r.id, r]));
      const existingIds = new Set(existingMap.keys());
      const freshToAdd: ExpenseRecord[] = [];
      const currentRecords = [...state.records];
      let recordsModified = false;

      for (const exp of newExpenses) {
        const id = exp.id || generateExpenseFingerprint({
          date: exp.date,
          vendor: exp.vendor,
          amount: exp.amount,
          description: exp.description,
        });

        if (existingIds.has(id)) {
          const existing = existingMap.get(id);
          // If the record exists, is not a custom split, and has an updated category (e.g. re-imported food costs)
          if (existing && !existing.isSplit && exp.category && existing.category !== exp.category) {
            const idx = currentRecords.findIndex((r) => r.id === id);
            if (idx !== -1) {
              const { businessAmount, personalAmount } = calculateSplitTotals(
                exp.amount,
                false,
                [],
                exp.category
              );
              currentRecords[idx] = {
                ...existing,
                category: exp.category,
                businessAmount,
                personalAmount,
              };
              recordsModified = true;
              updatedCount++;
            }
          } else {
            duplicateCount++;
          }
        } else {
          existingIds.add(id);
          const { businessAmount, personalAmount } = calculateSplitTotals(
            exp.amount,
            exp.isSplit,
            exp.splits || [],
            exp.category
          );

          freshToAdd.push({
            ...exp,
            id,
            splits: exp.splits || [],
            businessAmount,
            personalAmount,
            importedAt: exp.importedAt || new Date().toISOString(),
          });
          addedCount++;
        }
      }

      if (freshToAdd.length === 0 && !recordsModified) {
        return state;
      }

      const updated = [...freshToAdd, ...currentRecords];
      updated.sort((a, b) => b.date.localeCompare(a.date));

      saveExpenses(updated);
      return { records: updated };
    });

    return { added: addedCount, duplicates: duplicateCount, updated: updatedCount };
  },

  mergeExpenses: (incomingExpenses) => {
    let addedCount = 0;
    let duplicateCount = 0;
    let updatedCount = 0;

    set((state) => {
      const existingMap = new Map(state.records.map((r) => [r.id, r]));
      const existingFpMap = new Map(
        state.records.map((r) => [
          generateExpenseFingerprint({
            date: r.date,
            vendor: r.vendor,
            amount: r.amount,
            description: r.description,
          }),
          r,
        ])
      );

      const freshToAdd: ExpenseRecord[] = [];
      const currentRecords = [...state.records];
      let recordsModified = false;

      for (const exp of incomingExpenses) {
        const fp = generateExpenseFingerprint({
          date: exp.date,
          vendor: exp.vendor,
          amount: exp.amount,
          description: exp.description,
        });
        const id = exp.id || fp;

        const existing = existingMap.get(id) || existingFpMap.get(fp);

        if (existing) {
          let needsUpdate = false;
          let updatedItem = { ...existing };

          // If incoming has split info and existing does not
          if (exp.isSplit && exp.splits && exp.splits.length > 0 && !existing.isSplit) {
            const { businessAmount, personalAmount } = calculateSplitTotals(
              exp.amount,
              true,
              exp.splits,
              exp.category
            );
            updatedItem = {
              ...updatedItem,
              isSplit: true,
              splits: exp.splits,
              category: exp.category || existing.category,
              businessAmount,
              personalAmount,
            };
            needsUpdate = true;
          } else if (
            exp.category &&
            exp.category !== existing.category &&
            existing.category === 'Uncategorized'
          ) {
            const { businessAmount, personalAmount } = calculateSplitTotals(
              existing.amount,
              existing.isSplit,
              existing.splits,
              exp.category
            );
            updatedItem = {
              ...updatedItem,
              category: exp.category,
              businessAmount,
              personalAmount,
            };
            needsUpdate = true;
          }

          if (needsUpdate) {
            const idx = currentRecords.findIndex((r) => r.id === existing.id);
            if (idx !== -1) {
              currentRecords[idx] = updatedItem;
              existingMap.set(existing.id, updatedItem);
              recordsModified = true;
              updatedCount++;
            }
          } else {
            duplicateCount++;
          }
        } else {
          const { businessAmount, personalAmount } = calculateSplitTotals(
            exp.amount,
            exp.isSplit,
            exp.splits || [],
            exp.category
          );

          const newRecord: ExpenseRecord = {
            ...exp,
            id,
            splits: exp.splits || [],
            businessAmount,
            personalAmount,
            importedAt: exp.importedAt || new Date().toISOString(),
          };

          freshToAdd.push(newRecord);
          existingMap.set(id, newRecord);
          existingFpMap.set(fp, newRecord);
          addedCount++;
        }
      }

      if (freshToAdd.length === 0 && !recordsModified) {
        return state;
      }

      const updated = [...freshToAdd, ...currentRecords];
      updated.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      saveExpenses(updated);
      return { records: updated };
    });

    return { added: addedCount, duplicates: duplicateCount, updated: updatedCount };
  },

  restoreExpenses: (records) => {
    const valid = Array.isArray(records) ? [...records] : [];
    // Ensure split totals and formatting are recalculated properly
    const normalized = valid.map((exp) => {
      const { businessAmount, personalAmount } = calculateSplitTotals(
        exp.amount,
        exp.isSplit,
        exp.splits || [],
        exp.category
      );
      return {
        ...exp,
        businessAmount,
        personalAmount,
      };
    });
    normalized.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    saveExpenses(normalized);
    set({ records: normalized });
  },

  updateExpense: (id, updates) => {
    set((state) => {
      const updated = state.records.map((item) => {
        if (item.id !== id) return item;

        const merged = { ...item, ...updates };
        const { businessAmount, personalAmount } = calculateSplitTotals(
          merged.amount,
          merged.isSplit,
          merged.splits || [],
          merged.category
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

  setSelectedYear: (year) => {
    try {
      localStorage.setItem(SELECTED_YEAR_KEY, String(year));
    } catch {
      // Ignore
    }
    set({ selectedYear: year });
  },

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
}));
