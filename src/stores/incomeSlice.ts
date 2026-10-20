/**
 * Zustand Store Slice: Income Records & Filtering
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import { create } from 'zustand';
import type { EmbodiaInvoiceRecord, PaymentMethod, VisitCategory } from '../types/income';
import { generateEmbodiaFingerprint } from '../utils/fingerprint';

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
  mergeRecords: (records: EmbodiaInvoiceRecord[]) => AddRecordsResult;
  restoreRecords: (records: EmbodiaInvoiceRecord[]) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
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
