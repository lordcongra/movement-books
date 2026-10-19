/**
 * Split Transaction Modal Component
 * Enforces the invariant: sum(splits) === originalAmount with cents-safe precision math.
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Sparkles,
} from 'lucide-react';
import type { ExpenseCategory, ExpenseRecord, SplitSegment } from '../../types/expense';
import {
  calculateSplitRemainder,
  formatCurrency,
  roundCurrency,
  validateSplitInvariant,
} from '../../utils/currencyMath';
import { formatDisplayDate } from '../../utils/dateUtils';
import { TAX_CATEGORIES } from '../../utils/taxCategories';

interface SplitExpenseModalProps {
  expense: ExpenseRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ExpenseRecord>) => void;
}

let splitIdSeq = 0;
function nextSplitId(label: string): string {
  splitIdSeq += 1;
  return `sp_${splitIdSeq}_${label}`;
}

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSave,
}) => {
  const [splits, setSplits] = useState<SplitSegment[]>(() => {
    if (!expense) return [];
    if (expense.isSplit && expense.splits.length > 0) {
      return [...expense.splits];
    }
    const defaultCat = (expense.category !== 'Mixed / Split' && expense.category !== 'Uncategorized' && expense.category !== 'Personal / Non-Deductible'
      ? expense.category
      : 'Office Expense & Supplies') as ExpenseCategory;

    return [
      {
        id: nextSplitId('1'),
        type: 'business',
        amount: expense.amount,
        percentage: 100,
        category: defaultCat,
        notes: '',
      },
    ];
  });

  const selectedMainCategory: ExpenseCategory | 'Uncategorized' =
    expense && expense.category !== 'Mixed / Split' && expense.category !== 'Personal / Non-Deductible'
      ? expense.category
      : 'Utilities & Phone';

  if (!isOpen || !expense) return null;

  const total = expense.amount;
  const remainder = calculateSplitRemainder(splits, total);
  const isBalanced = validateSplitInvariant(splits, total);

  // Quick Preset Handlers
  const applyPreset100Business = () => {
    const defaultCat = (selectedMainCategory !== 'Uncategorized' ? selectedMainCategory : 'Office Expense & Supplies') as ExpenseCategory;
    setSplits([
      {
        id: nextSplitId('full_biz'),
        type: 'business',
        amount: total,
        percentage: 100,
        category: defaultCat,
        notes: '100% Ordinary & Necessary Business Expense',
      },
    ]);
  };

  const applyPreset6040Phone = () => {
    const bizAmount = roundCurrency(total * 0.6);
    const persAmount = roundCurrency(total - bizAmount);

    setSplits([
      {
        id: nextSplitId('phone_biz'),
        type: 'business',
        amount: bizAmount,
        percentage: 60,
        category: 'Utilities & Phone',
        notes: '60% PT practice patient scheduling & clinic calls',
      },
      {
        id: nextSplitId('phone_pers'),
        type: 'personal',
        amount: persAmount,
        percentage: 40,
        category: 'Personal / Non-Deductible',
        notes: '40% personal smartphone usage',
      },
    ]);
  };

  const applyPreset5050 = () => {
    const half1 = roundCurrency(total * 0.5);
    const half2 = roundCurrency(total - half1);
    const defaultCat = (selectedMainCategory !== 'Uncategorized' ? selectedMainCategory : 'Utilities & Phone') as ExpenseCategory;

    setSplits([
      {
        id: nextSplitId('half_biz'),
        type: 'business',
        amount: half1,
        percentage: 50,
        category: defaultCat,
        notes: '50% Business allocation',
      },
      {
        id: nextSplitId('half_pers'),
        type: 'personal',
        amount: half2,
        percentage: 50,
        category: 'Personal / Non-Deductible',
        notes: '50% Personal allocation',
      },
    ]);
  };

  const applyPreset8020 = () => {
    const bizAmount = roundCurrency(total * 0.8);
    const persAmount = roundCurrency(total - bizAmount);
    const defaultCat = (selectedMainCategory !== 'Uncategorized' ? selectedMainCategory : 'Utilities & Phone') as ExpenseCategory;

    setSplits([
      {
        id: nextSplitId('eighty_biz'),
        type: 'business',
        amount: bizAmount,
        percentage: 80,
        category: defaultCat,
        notes: '80% Business allocation',
      },
      {
        id: nextSplitId('twenty_pers'),
        type: 'personal',
        amount: persAmount,
        percentage: 20,
        category: 'Personal / Non-Deductible',
        notes: '20% Personal allocation',
      },
    ]);
  };

  const handleUpdateSegment = (idx: number, updates: Partial<SplitSegment>) => {
    setSplits((prev) => {
      const next = [...prev];
      const current = next[idx];
      let newAmount = updates.amount !== undefined ? updates.amount : current.amount;
      let newPct = current.percentage;

      if (updates.amount !== undefined) {
        newAmount = roundCurrency(updates.amount);
        newPct = total > 0 ? Math.round((newAmount / total) * 100) : 0;
      }

      next[idx] = {
        ...current,
        ...updates,
        amount: newAmount,
        percentage: newPct,
      };
      return next;
    });
  };

  const handleAddSegment = () => {
    const autoAmount = remainder > 0 ? remainder : 0;
    const autoPct = total > 0 ? Math.round((autoAmount / total) * 100) : 0;

    setSplits((prev) => [
      ...prev,
      {
        id: nextSplitId(`seg_${prev.length + 1}`),
        type: 'personal',
        amount: autoAmount,
        percentage: autoPct,
        category: 'Personal / Non-Deductible',
        notes: '',
      },
    ]);
  };

  const handleRemoveSegment = (idx: number) => {
    if (splits.length <= 1) return;
    setSplits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAutoBalance = () => {
    if (splits.length === 0) return;
    const lastIdx = splits.length - 1;
    const currentLast = splits[lastIdx];
    const adjustedAmount = roundCurrency(currentLast.amount + remainder);
    if (adjustedAmount >= 0) {
      handleUpdateSegment(lastIdx, { amount: adjustedAmount });
    }
  };

  const handleSave = () => {
    if (!isBalanced) return;

    const isSplit = splits.length > 1;
    let category: ExpenseRecord['category'] = 'Mixed / Split';

    if (!isSplit && splits.length === 1) {
      category = splits[0].type === 'personal'
        ? 'Personal / Non-Deductible'
        : splits[0].category;
    }

    onSave(expense.id, {
      isSplit,
      splits,
      category,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog split-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Scissors size={20} aria-hidden="true" />
            </div>
            <div>
              <h2>Split Transaction Invariant Engine</h2>
              <p className="modal-subtitle">
                {expense.vendor} • {formatDisplayDate(expense.date)} • Total:{' '}
                <strong>{formatCurrency(total)}</strong>
              </p>
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

        <div className="modal-body">
          {/* Presets Bar */}
          <div className="split-presets-section">
            <span className="preset-label">Quick Presets:</span>
            <div className="preset-buttons">
              <button type="button" className="preset-btn" onClick={applyPreset100Business}>
                <Sparkles size={12} aria-hidden="true" /> 100% Business
              </button>
              <button type="button" className="preset-btn" onClick={applyPreset6040Phone}>
                60/40 Cell Phone
              </button>
              <button type="button" className="preset-btn" onClick={applyPreset5050}>
                50/50 Shared
              </button>
              <button type="button" className="preset-btn" onClick={applyPreset8020}>
                80/20 Mixed
              </button>
            </div>
          </div>

          {/* Invariant Status Banner */}
          <div className={`split-invariant-banner ${isBalanced ? 'balanced' : 'unbalanced'}`}>
            <div className="banner-status-left">
              {isBalanced ? (
                <>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>Invariant Satisfied: Total splits strictly equal {formatCurrency(total)} ($0.00 unallocated).</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>
                    Unallocated: <strong>{formatCurrency(remainder)}</strong>. Sum of splits must strictly equal {formatCurrency(total)}.
                  </span>
                </>
              )}
            </div>
            {!isBalanced && (
              <button
                type="button"
                className="autobalance-btn"
                onClick={handleAutoBalance}
                title="Adjust the last segment to absorb remaining cents"
              >
                Auto-Balance
              </button>
            )}
          </div>

          {/* Segments List */}
          <div className="split-segments-list">
            {splits.map((seg, idx) => (
              <div key={seg.id} className={`split-segment-card segment-${seg.type}`}>
                <div className="segment-card-header">
                  <span className="segment-number">Segment #{idx + 1}</span>
                  <div className="segment-type-toggle">
                    <button
                      type="button"
                      className={`type-toggle-btn ${seg.type === 'business' ? 'active-business' : ''}`}
                      onClick={() =>
                        handleUpdateSegment(idx, {
                          type: 'business',
                          category: 'Office Expense & Supplies',
                        })
                      }
                    >
                      Business (Deductible)
                    </button>
                    <button
                      type="button"
                      className={`type-toggle-btn ${seg.type === 'personal' ? 'active-personal' : ''}`}
                      onClick={() =>
                        handleUpdateSegment(idx, {
                          type: 'personal',
                          category: 'Personal / Non-Deductible',
                        })
                      }
                    >
                      Personal
                    </button>
                  </div>
                  {splits.length > 1 && (
                    <button
                      type="button"
                      className="segment-remove-btn"
                      onClick={() => handleRemoveSegment(idx)}
                      aria-label="Remove this split segment"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="segment-fields-grid">
                  <div className="segment-field">
                    <label htmlFor={`amount_${seg.id}`}>Amount ($)</label>
                    <input
                      id={`amount_${seg.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      className="modal-input"
                      value={seg.amount}
                      onChange={(e) => handleUpdateSegment(idx, { amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="segment-field">
                    <label htmlFor={`pct_${seg.id}`}>Percentage (%)</label>
                    <input
                      id={`pct_${seg.id}`}
                      type="number"
                      min="0"
                      max="100"
                      className="modal-input"
                      value={seg.percentage}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        const amt = roundCurrency((pct / 100) * total);
                        handleUpdateSegment(idx, { amount: amt, percentage: pct });
                      }}
                    />
                  </div>

                  <div className="segment-field field-grow">
                    <label htmlFor={`cat_${seg.id}`}>Schedule C Tax Category</label>
                    {seg.type === 'business' ? (
                      <select
                        id={`cat_${seg.id}`}
                        className="modal-select"
                        value={seg.category}
                        onChange={(e) =>
                          handleUpdateSegment(idx, { category: e.target.value as ExpenseCategory })
                        }
                      >
                        {TAX_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.scheduleCLine})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`cat_${seg.id}`}
                        type="text"
                        className="modal-input"
                        value="Personal / Non-Deductible"
                        disabled
                      />
                    )}
                  </div>
                </div>

                <div className="segment-notes-row">
                  <input
                    type="text"
                    className="modal-input-subtle"
                    placeholder="Optional IRS business purpose notes (e.g., patient phone calls, home visit gas)..."
                    value={seg.notes || ''}
                    onChange={(e) => handleUpdateSegment(idx, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="add-segment-wrap">
            <button
              type="button"
              className="add-segment-btn"
              onClick={handleAddSegment}
            >
              <Plus size={14} aria-hidden="true" />
              <span>Add Another Split Segment</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={!isBalanced}
            title={!isBalanced ? 'Splits must strictly equal total before saving' : 'Save split transaction'}
          >
            Apply & Save Split
          </button>
        </div>
      </div>
    </div>
  );
};
