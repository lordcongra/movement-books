/**
 * Expense Tab Orchestrator Component
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState, useMemo, useRef } from 'react';
import { PieChart } from 'lucide-react';
import { useExpenseStore } from '../../stores/expenseSlice';
import type { ExpenseRecord } from '../../types/expense';
import { ExpenseHeader } from './ExpenseHeader';
import { ExpenseDropzone, type ExpenseDropzoneHandle } from './ExpenseDropzone';
import { ExpenseToolbar } from './ExpenseToolbar';
import { ExpenseTable } from './ExpenseTable';
import { SplitExpenseModal } from './SplitExpenseModal';
import { ManualExpenseModal } from './ManualExpenseModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { sumAmounts } from '../../utils/currencyMath';
import './ExpenseTab.css';

export const ExpenseTab: React.FC = () => {
  const records = useExpenseStore((state) => state.records);
  const selectedYear = useExpenseStore((state) => state.selectedYear);
  const selectedCategory = useExpenseStore((state) => state.selectedCategory);
  const addExpense = useExpenseStore((state) => state.addExpense);
  const updateExpense = useExpenseStore((state) => state.updateExpense);
  const removeExpense = useExpenseStore((state) => state.removeExpense);
  const clearCategoryExpenses = useExpenseStore((state) => state.clearCategoryExpenses);
  const setSelectedCategory = useExpenseStore((state) => state.setSelectedCategory);

  const dropzoneRef = useRef<ExpenseDropzoneHandle>(null);

  // Local UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [splitModalRecord, setSplitModalRecord] = useState<ExpenseRecord | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filter records based on active year, category, and search query
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Year filter
      if (selectedYear && !r.date.startsWith(String(selectedYear))) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'Uncategorized') {
          if (r.category !== 'Uncategorized') return false;
        } else if (selectedCategory === 'Mixed / Split') {
          if (!r.isSplit && r.category !== 'Mixed / Split') return false;
        } else if (selectedCategory === 'Personal / Non-Deductible') {
          if (r.category !== 'Personal / Non-Deductible' && r.personalAmount <= 0) return false;
        } else {
          // Standard Schedule C category
          const matchesDirect = r.category === selectedCategory;
          const matchesSplit = r.isSplit && r.splits.some((s) => s.category === selectedCategory);
          if (!matchesDirect && !matchesSplit) return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesVendor = r.vendor.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesNotes = (r.notes || '').toLowerCase().includes(q);
        const matchesCat = r.category.toLowerCase().includes(q);
        if (!matchesVendor && !matchesDesc && !matchesNotes && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedYear, selectedCategory, searchQuery]);

  const handleOpenSplit = (record: ExpenseRecord) => {
    setSplitModalRecord(record);
    setIsSplitModalOpen(true);
  };

  const handleSaveSplit = (id: string, updates: Partial<ExpenseRecord>) => {
    updateExpense(id, updates);
  };

  // Determine records targeted for deletion by the selected category
  const recordsToDelete = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return records;
    }
    return records.filter((r) => {
      if (selectedCategory === 'Uncategorized') return r.category === 'Uncategorized';
      if (selectedCategory === 'Mixed / Split') return r.isSplit || r.category === 'Mixed / Split';
      if (selectedCategory === 'Personal / Non-Deductible') {
        return r.category === 'Personal / Non-Deductible' || r.personalAmount > 0;
      }
      return (
        r.category === selectedCategory ||
        (r.isSplit && r.splits?.some((s) => s.category === selectedCategory))
      );
    });
  }, [records, selectedCategory]);

  const recordsToDeleteAmount = useMemo(() => {
    return sumAmounts(recordsToDelete.map((r) => r.amount));
  }, [recordsToDelete]);

  return (
    <div className="expense-tab-container">
      {/* 1. Informational Banner */}
      <div className="expense-info-banner">
        <div className="info-banner-icon">
          <PieChart size={22} aria-hidden="true" />
        </div>
        <div className="info-banner-content">
          <h3>Split Transaction Invariant Engine</h3>
          <p>
            For solo PT practices, mixed expenses (e.g. smartphone plan, clinical sublease, equipment)
            require exact mathematical apportionment. The system enforces the invariant:{' '}
            <code>sum(splits) === originalAmount</code> with cents-safe precision math to ensure
            audit-proof IRS Schedule C deductions.
          </p>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <ExpenseHeader records={records} selectedYear={selectedYear} />

      {/* 3. Drag & Drop CSV Importer Card */}
      <ExpenseDropzone ref={dropzoneRef} />

      {/* 4. Toolbar: Search, Filters & Action Buttons */}
      <ExpenseToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onImportBankClick={() => dropzoneRef.current?.triggerBankUpload()}
        onImportStripeClick={() => dropzoneRef.current?.triggerStripeUpload()}
        onClearCategoryClick={() => setIsDeleteModalOpen(true)}
        recordCount={filteredRecords.length}
      />

      {/* 5. Dense Data Table */}
      <ExpenseTable
        records={filteredRecords}
        onEditSplit={handleOpenSplit}
        onDeleteRecord={removeExpense}
      />

      {/* 6. Modals */}
      {isSplitModalOpen && splitModalRecord && (
        <SplitExpenseModal
          key={splitModalRecord.id}
          expense={splitModalRecord}
          isOpen={isSplitModalOpen}
          onClose={() => {
            setIsSplitModalOpen(false);
            setSplitModalRecord(null);
          }}
          onSave={handleSaveSplit}
        />
      )}

      <ManualExpenseModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={addExpense}
      />

      {/* 7. Double-Confirmation Deletion Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => clearCategoryExpenses(selectedCategory)}
        categoryName={selectedCategory === 'ALL' ? 'All Expense Records' : `${selectedCategory} Expenses`}
        count={recordsToDelete.length}
        totalAmount={recordsToDeleteAmount}
        itemType="expense"
      />
    </div>
  );
};
