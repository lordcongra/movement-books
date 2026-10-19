/**
 * Income Toolbar: Search, Filters, and Actions
 */

import React from 'react';
import { Search, Filter, Trash2 } from 'lucide-react';
import type { PaymentMethod, VisitCategory } from '../../types/income';
import { useIncomeStore } from '../../stores/incomeSlice';

interface IncomeToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  recordCount: number;
}

export const IncomeToolbar: React.FC<IncomeToolbarProps> = ({
  searchQuery,
  onSearchChange,
  recordCount,
}) => {
  const selectedCategory = useIncomeStore((state) => state.selectedCategory);
  const setSelectedCategory = useIncomeStore((state) => state.setSelectedCategory);
  const selectedPaymentMethod = useIncomeStore((state) => state.selectedPaymentMethod);
  const setSelectedPaymentMethod = useIncomeStore((state) => state.setSelectedPaymentMethod);
  const clearRecords = useIncomeStore((state) => state.clearRecords);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all imported income records? This cannot be undone.')) {
      clearRecords();
    }
  };

  return (
    <div className="income-toolbar">
      <div className="toolbar-left">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search description, patient..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search records"
          />
        </div>

        <div className="filter-group">
          <div className="filter-select-wrap">
            <Filter size={14} aria-hidden="true" />
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as VisitCategory | 'ALL')}
              aria-label="Filter by visit category"
            >
              <option value="ALL">All Categories</option>
              <option value="Evaluation">Evaluation</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Dry Needling">Dry Needling</option>
              <option value="Cancellation">Cancellation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select
              className="filter-select"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod | 'ALL')}
              aria-label="Filter by payment method"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Stripe">Stripe</option>
              <option value="Check">Check</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        <span className="record-count-text">
          Showing <strong>{recordCount}</strong> records
        </span>

        {recordCount > 0 && (
          <button
            type="button"
            className="clear-records-btn"
            onClick={handleClear}
            title="Clear all imported records"
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Clear All</span>
          </button>
        )}
      </div>
    </div>
  );
};
