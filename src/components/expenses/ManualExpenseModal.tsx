/**
 * Manual Expense Entry Modal
 * Allows logging one-off physical therapy business expenses with optional quick split.
 */

import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import type { ExpenseCategory, ExpenseRecord } from '../../types/expense';
import { roundCurrency } from '../../utils/currencyMath';
import { TAX_CATEGORIES } from '../../utils/taxCategories';

interface ManualExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Omit<ExpenseRecord, 'id' | 'businessAmount' | 'personalAmount'>) => void;
}

function getTodayIso(): string {
  return new Date().toISOString().substring(0, 10);
}

let manualSplitSeq = 0;
function nextManualSplitId(label: string): string {
  manualSplitSeq += 1;
  return `sp_man_${manualSplitSeq}_${label}`;
}

export const ManualExpenseModal: React.FC<ManualExpenseModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [date, setDate] = useState(getTodayIso);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Office Expense & Supplies');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Business)');
  const [notes, setNotes] = useState('');

  // Split state
  const [isSplit, setIsSplit] = useState(false);
  const [businessPct, setBusinessPct] = useState(60);

  if (!isOpen) return null;

  const totalAmount = parseFloat(amountStr) || 0;
  const businessAmount = roundCurrency((businessPct / 100) * totalAmount);
  const personalAmount = roundCurrency(totalAmount - businessAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendor.trim()) {
      alert('Please enter a vendor or payee name.');
      return;
    }
    if (totalAmount <= 0) {
      alert('Please enter a valid positive expense amount.');
      return;
    }

    const splits = isSplit
      ? [
          {
            id: nextManualSplitId('biz'),
            type: 'business' as const,
            amount: businessAmount,
            percentage: businessPct,
            category,
            notes: notes ? `${notes} (Business portion)` : 'Business portion',
          },
          {
            id: nextManualSplitId('pers'),
            type: 'personal' as const,
            amount: personalAmount,
            percentage: 100 - businessPct,
            category: 'Personal / Non-Deductible' as const,
            notes: 'Personal portion',
          },
        ]
      : [];

    onAdd({
      date,
      vendor: vendor.trim(),
      description: description.trim() || `${category} - ${vendor.trim()}`,
      amount: totalAmount,
      isSplit,
      splits,
      category: isSplit ? 'Mixed / Split' : category,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog manual-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <PlusCircle size={20} aria-hidden="true" />
            </div>
            <div>
              <h2>Add Manual Expense</h2>
              <p className="modal-subtitle">Log an out-of-pocket or direct clinical expense</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="manual_date">Transaction Date *</label>
                <input
                  id="manual_date"
                  type="date"
                  className="modal-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="manual_amount">Total Amount ($) *</label>
                <input
                  id="manual_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="modal-input"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="manual_vendor">Vendor / Payee *</label>
                <input
                  id="manual_vendor"
                  type="text"
                  placeholder="e.g., Lhasa OMS, MedBridge, Verizon"
                  className="modal-input"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="manual_payment">Payment Method</label>
                <select
                  id="manual_payment"
                  className="modal-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Credit Card (Business)">Credit Card (Business)</option>
                  <option value="Credit Card (Personal)">Credit Card (Personal)</option>
                  <option value="Bank Account / Debit">Bank Account / Debit</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="manual_desc">Description / Purpose</label>
              <input
                id="manual_desc"
                type="text"
                placeholder="e.g., Seirin Dry Needling Needles & Sharps Container"
                className="modal-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="manual_cat">IRS Schedule C Tax Category *</label>
              <select
                id="manual_cat"
                className="modal-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                {TAX_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.scheduleCLine})
                  </option>
                ))}
              </select>
            </div>

            {/* Split Toggle */}
            <div className="split-toggle-box">
              <label className="split-toggle-label">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                />
                <span>Split between Business & Personal (e.g., Cell Phone, Home Internet)</span>
              </label>

              {isSplit && (
                <div className="manual-split-controls">
                  <div className="split-pct-row">
                    <label htmlFor="manual_biz_pct">Business Portion: <strong>{businessPct}%</strong> (${businessAmount.toFixed(2)})</label>
                    <input
                      id="manual_biz_pct"
                      type="range"
                      min="1"
                      max="99"
                      value={businessPct}
                      onChange={(e) => setBusinessPct(Number(e.target.value))}
                    />
                  </div>
                  <div className="split-summary-tag">
                    Deductible Business: <strong>${businessAmount.toFixed(2)}</strong> • Personal Non-Deductible: <strong>${personalAmount.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="manual_notes">Notes / Tax Justification (Optional)</label>
              <input
                id="manual_notes"
                type="text"
                placeholder="e.g., 60% clinical patient calls and telehealth usage"
                className="modal-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
