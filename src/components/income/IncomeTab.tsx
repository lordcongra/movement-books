/**
 * Income Tab Orchestrator Component
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState, useMemo } from 'react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { IncomeHeader } from './IncomeHeader';
import { EmbodiaDropzone } from './EmbodiaDropzone';
import { IncomeToolbar } from './IncomeToolbar';
import { IncomeTable } from './IncomeTable';
import './IncomeTab.css';

export const IncomeTab: React.FC = () => {
  const records = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const selectedCategory = useIncomeStore((state) => state.selectedCategory);
  const selectedPaymentMethod = useIncomeStore((state) => state.selectedPaymentMethod);
  const removeRecord = useIncomeStore((state) => state.removeRecord);

  const [searchQuery, setSearchQuery] = useState('');

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
      />

      {/* 4. Dense Data Table */}
      <IncomeTable
        records={filteredRecords}
        onDeleteRecord={removeRecord}
      />
    </div>
  );
};
