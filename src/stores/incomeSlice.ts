/**
 * Zustand Store Slice: Income Records & Filtering
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import { create } from 'zustand';
import type { EmbodiaInvoiceRecord, ManualIncomeInput, PaymentMethod, VisitCategory } from '../types/income';
import { generateEmbodiaFingerprint } from '../utils/fingerprint';
import { roundCurrency } from '../utils/currencyMath';

const STORAGE_KEY = 'movement_books_income_records_v1';
const SELECTED_YEAR_KEY = 'movement_books_selected_year_v1';

export interface AddRecordsResult {
  added: number;
  duplicates: number;
}

export interface IncomeState {
  records: EmbodiaInvoiceRecord[];
  selectedYear: number;
  selectedCategory: VisitCategory | 'ALL';
  selectedPaymentMethod: PaymentMethod | 'ALL';

  // Actions
  addRecords: (newRecords: EmbodiaInvoiceRecord[]) => AddRecordsResult;
  addManualIncome: (income: ManualIncomeInput) => EmbodiaInvoiceRecord;
  mergeRecords: (records: EmbodiaInvoiceRecord[]) => AddRecordsResult;
  restoreRecords: (records: EmbodiaInvoiceRecord[]) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
  clearCategoryRecords: (cat: VisitCategory | 'ALL') => void;
  setSelectedYear: (year: number) => void;
  setSelectedCategory: (cat: VisitCategory | 'ALL') => void;
  setSelectedPaymentMethod: (pm: PaymentMethod | 'ALL') => void;
}

function loadInitialRecords(): EmbodiaInvoiceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load income records from localStorage:', err);
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

function saveRecords(records: EmbodiaInvoiceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to persist income records to localStorage:', err);
  }
}

export const useIncomeStore = create<IncomeState>((set) => ({
  records: loadInitialRecords(),
  selectedYear: loadInitialYear(),
  selectedCategory: 'ALL',
  selectedPaymentMethod: 'ALL',

  addRecords: (newRecords) => {
    let addedCount = 0;
    let duplicateCount = 0;

    set((state) => {
      const existingIds = new Set(state.records.map((r) => r.id));
      const freshToAdd: EmbodiaInvoiceRecord[] = [];

      for (const record of newRecords) {
        if (existingIds.has(record.id)) {
          duplicateCount++;
        } else {
          existingIds.add(record.id);
          freshToAdd.push(record);
          addedCount++;
        }
      }

      if (freshToAdd.length === 0) {
        return state;
      }

      const updated = [...state.records, ...freshToAdd];
      // Sort newest first by paidAt or invoiceDate
      updated.sort((a, b) => {
        const dateA = a.paidAt || a.invoiceDate;
        const dateB = b.paidAt || b.invoiceDate;
        return dateB.localeCompare(dateA);
      });

      saveRecords(updated);
      return { records: updated };
    });

    return { added: addedCount, duplicates: duplicateCount };
  },

  mergeRecords: (incomingRecords) => {
    let addedCount = 0;
    let duplicateCount = 0;

    set((state) => {
      const existingIds = new Set<string>();
      const existingFingerprints = new Set<string>();

      for (const r of state.records) {
        if (r.id) existingIds.add(r.id);
        const fp = generateEmbodiaFingerprint({
          invoiceDate: r.invoiceDate,
          invoiceNumber: r.invoiceNumber,
          patient: r.patient,
          description: r.description,
          totalPaid: r.totalPaid,
          paidAt: r.paidAt,
          total: r.total,
        });
        existingFingerprints.add(fp);
      }

      const freshToAdd: EmbodiaInvoiceRecord[] = [];

      for (const record of incomingRecords) {
        const fp = generateEmbodiaFingerprint({
          invoiceDate: record.invoiceDate,
          invoiceNumber: record.invoiceNumber,
          patient: record.patient,
          description: record.description,
          totalPaid: record.totalPaid,
          paidAt: record.paidAt,
          total: record.total,
        });

        const effectiveId = record.id || fp;

        if (existingIds.has(effectiveId) || existingFingerprints.has(fp)) {
          duplicateCount++;
        } else {
          existingIds.add(effectiveId);
          existingFingerprints.add(fp);
          freshToAdd.push({
            ...record,
            id: effectiveId,
          });
          addedCount++;
        }
      }

      if (freshToAdd.length === 0) {
        return state;
      }

      const updated = [...state.records, ...freshToAdd];
      updated.sort((a, b) => {
        const dateA = a.paidAt || a.invoiceDate;
        const dateB = b.paidAt || b.invoiceDate;
        return (dateB || '').localeCompare(dateA || '');
      });

      saveRecords(updated);
      return { records: updated };
    });

    return { added: addedCount, duplicates: duplicateCount };
  },

  restoreRecords: (records) => {
    const valid = Array.isArray(records) ? [...records] : [];
    valid.sort((a, b) => {
      const dateA = a.paidAt || a.invoiceDate;
      const dateB = b.paidAt || b.invoiceDate;
      return (dateB || '').localeCompare(dateA || '');
    });
    saveRecords(valid);
    set({ records: valid });
  },

  addManualIncome: (income) => {
    const roundedAmount = roundCurrency(income.amount);
    const isPaid = income.isPaid !== false;
    const id = `inc_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: EmbodiaInvoiceRecord = {
      id,
      invoiceDate: income.date,
      rawInvoiceDate: income.date,
      invoiceNumber: income.invoiceNumber?.trim() || `MAN-${Date.now().toString().slice(-6)}`,
      patient: income.patient?.trim() || 'Direct Client',
      email: '',
      practitioner: income.practitioner?.trim() || 'Self',
      description: income.description.trim() || 'Non-Embodia Income',
      visitCategory: income.visitCategory,
      currency: 'USD',
      subtotal: roundedAmount,
      taxes: 0,
      total: roundedAmount,
      subtotalPaid: isPaid ? roundedAmount : 0,
      taxesPaid: 0,
      totalPaid: isPaid ? roundedAmount : 0,
      paidAt: isPaid ? income.date : '',
      rawPaidAt: isPaid ? income.date : '',
      paymentMethod: income.paymentMethod,
      rawPaymentMethod: income.paymentMethod,
      status: isPaid ? 'Paid in full' : 'Unpaid',
      isCashBasisRevenue: isPaid && roundedAmount > 0,
      importedAt: new Date().toISOString(),
      source: 'manual',
      notes: income.notes?.trim() || undefined,
    };

    set((state) => {
      const updated = [newRecord, ...state.records];
      updated.sort((a, b) => {
        const dateA = a.paidAt || a.invoiceDate;
        const dateB = b.paidAt || b.invoiceDate;
        return (dateB || '').localeCompare(dateA || '');
      });
      saveRecords(updated);
      return { records: updated };
    });

    return newRecord;
  },

  removeRecord: (id) => {
    set((state) => {
      const updated = state.records.filter((r) => r.id !== id);
      saveRecords(updated);
      return { records: updated };
    });
  },

  clearRecords: () => {
    saveRecords([]);
    set({ records: [] });
  },

  clearCategoryRecords: (category) => {
    set((state) => {
      const updated =
        category === 'ALL'
          ? []
          : state.records.filter((r) => r.visitCategory !== category);
      saveRecords(updated);
      return { records: updated };
    });
  },

  setSelectedYear: (year) => {
    try {
      localStorage.setItem(SELECTED_YEAR_KEY, String(year));
    } catch {
      // Ignore
    }
    set({ selectedYear: year });
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedPaymentMethod: (pm) => set({ selectedPaymentMethod: pm }),
}));
