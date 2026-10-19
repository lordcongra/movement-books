/**
 * Expense Tab Toolbar
 * Search input, Category filter, Manual Expense entry, and CSV Import actions.
 */

import React from 'react';
import {
  Search,
  PlusCircle,
  Building2,
  CreditCard,
} from 'lucide-react';
import { TAX_CATEGORIES } from '../../utils/taxCategories';

interface ExpenseToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onOpenManualModal: () => void;
  onImportBankClick: () => void;
  onImportStripeClick: () => void;
  recordCount: number;
}

export const ExpenseToolbar: React.FC<ExpenseToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onOpenManualModal,
  onImportBankClick,
  onImportStripeClick,
  recordCount,
}) => {
  return (
    <div className="income-toolbar">
      <div className="toolbar-left">
        {/* Search Input */}
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search vendor, description, or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search expenses"
          />
        </div>

        {/* Category Filter Dropdown */}
        <div className="filter-dropdown-wrap">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter expenses by tax category"
          >
            <option value="ALL">All Categories</option>
            <option value="Uncategorized">⚠️ Uncategorized</option>
            <option value="Mixed / Split">✂️ Mixed / Split</option>
            <option disabled>──────────</option>
            {TAX_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            <option disabled>──────────</option>
            <option value="Personal / Non-Deductible">Personal / Non-Deductible</option>
          </select>
        </div>
      </div>

      <div className="toolbar-right">
        <span className="record-count-text">
          <strong>{recordCount}</strong> {recordCount === 1 ? 'record' : 'records'}
        </span>

        {/* Action Buttons */}
        <div className="expense-toolbar-actions">
          <button
            type="button"
            className="secondary-action-btn"
            onClick={onImportBankClick}
            title="Import Bank Statement CSV"
          >
            <Building2 size={14} aria-hidden="true" />
            <span>Import Bank CSV</span>
          </button>

          <button
            type="button"
            className="secondary-action-btn"
            onClick={onImportStripeClick}
            title="Import Stripe Activity Fee CSV"
          >
            <CreditCard size={14} aria-hidden="true" />
            <span>Import Stripe Summary</span>
          </button>

          <button
            type="button"
            className="primary-action-btn"
            onClick={onOpenManualModal}
            title="Add a manual expense record"
          >
            <PlusCircle size={15} aria-hidden="true" />
            <span>Add Manual Expense</span>
          </button>
        </div>
      </div>
    </div>
  );
};
