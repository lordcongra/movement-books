/**
 * Income Tab Orchestrator Component
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState, useMemo } from 'react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { sumAmounts } from '../../utils/currencyMath';
import { IncomeHeader } from './IncomeHeader';
import { EmbodiaDropzone } from './EmbodiaDropzone';
import { IncomeToolbar } from './IncomeToolbar';
import { IncomeTable } from './IncomeTable';
import { ManualIncomeModal } from './ManualIncomeModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import './IncomeTab.css';

export const IncomeTab: React.FC = () => {
  const records = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const selectedCategory = useIncomeStore((state) => state.selectedCategory);
  const selectedPaymentMethod = useIncomeStore((state) => state.selectedPaymentMethod);
  const addManualIncome = useIncomeStore((state) => state.addManualIncome);
  const removeRecord = useIncomeStore((state) => state.removeRecord);
  const clearCategoryRecords = useIncomeStore((state) => state.clearCategoryRecords);

  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filter records based on active year, category, payment method, and search
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Year filter
      const recordDate = r.paidAt || r.invoiceDate;
      if (selectedYear && !recordDate.startsWith(String(selectedYear))) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL' && r.visitCategory !== selectedCategory) {
        return false;
      }

      // 3. Payment Method filter
      if (selectedPaymentMethod !== 'ALL' && r.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesPat = r.patient.toLowerCase().includes(q);
        const matchesPract = r.practitioner.toLowerCase().includes(q);
        const matchesInv = r.invoiceNumber.toLowerCase().includes(q);
        if (!matchesDesc && !matchesPat && !matchesPract && !matchesInv) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedYear, selectedCategory, selectedPaymentMethod, searchQuery]);

  // Determine records targeted for deletion by the selected category
  const recordsToDelete = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return records;
    }
    return records.filter((r) => r.visitCategory === selectedCategory);
  }, [records, selectedCategory]);

  const recordsToDeleteAmount = useMemo(() => {
    return sumAmounts(recordsToDelete.map((r) => r.totalPaid));
  }, [recordsToDelete]);

  const handleConfirmDelete = () => {
    clearCategoryRecords(selectedCategory);
  };

  return (
    <div className="income-tab-container">
      {/* 1. Summary Metric Cards */}
      <IncomeHeader records={records} selectedYear={selectedYear} />

      {/* 2. Drag & Drop CSV Upload Card */}
      <EmbodiaDropzone />

      {/* 3. Toolbar: Search, Filters & Actions */}
      <IncomeToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        recordCount={filteredRecords.length}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onClearCategoryClick={() => setIsDeleteModalOpen(true)}
      />

      {/* 4. Dense Data Table */}
      <IncomeTable
        records={filteredRecords}
        onDeleteRecord={removeRecord}
      />

      {/* 5. Manual Non-Embodia Income Entry Modal */}
      <ManualIncomeModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={addManualIncome}
      />

      {/* 6. Double-Confirmation Deletion Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        categoryName={selectedCategory === 'ALL' ? 'All Income Records' : `${selectedCategory} Income`}
        count={recordsToDelete.length}
        totalAmount={recordsToDeleteAmount}
        itemType="income"
      />
    </div>
  );
};
