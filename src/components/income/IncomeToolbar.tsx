/**
 * Income Toolbar: Search, Filters, and Actions
 */

import React from 'react';
import { Search, Filter, Trash2, PlusCircle } from 'lucide-react';
import type { PaymentMethod, VisitCategory } from '../../types/income';
import { useIncomeStore } from '../../stores/incomeSlice';

interface IncomeToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  recordCount: number;
  onOpenManualModal: () => void;
  onClearCategoryClick: () => void;
}

export const IncomeToolbar: React.FC<IncomeToolbarProps> = ({
  searchQuery,
  onSearchChange,
  recordCount,
  onOpenManualModal,
  onClearCategoryClick,
}) => {
  const selectedCategory = useIncomeStore((state) => state.selectedCategory);
  const setSelectedCategory = useIncomeStore((state) => state.setSelectedCategory);
  const selectedPaymentMethod = useIncomeStore((state) => state.selectedPaymentMethod);
  const setSelectedPaymentMethod = useIncomeStore((state) => state.setSelectedPaymentMethod);

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

        <button
          type="button"
          className="primary-action-btn"
          onClick={onOpenManualModal}
          title="Log non-Embodia income (cash, check, direct payment, workshop)"
          style={{
            backgroundColor: 'var(--income-green)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <PlusCircle size={15} aria-hidden="true" />
          <span>Log Non-Embodia Income</span>
        </button>

        {recordCount > 0 && (
          <button
            type="button"
            className="clear-records-btn"
            onClick={onClearCategoryClick}
            title={selectedCategory === 'ALL' ? 'Clear all income records' : `Clear all ${selectedCategory} records`}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>{selectedCategory === 'ALL' ? 'Clear All' : `Clear "${selectedCategory}"`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
