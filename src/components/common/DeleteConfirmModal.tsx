/**
 * Reusable Double-Confirmation Deletion Modal
 * Safeguards financial data by requiring an explicit checkbox and confirmation phrase.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyMath';
import './DeleteConfirmModal.css';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  count: number;
  totalAmount?: number;
  itemType?: 'income' | 'expense' | 'records';
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  count,
  totalAmount,
  itemType = 'records',
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setIsAcknowledged(false);
      setConfirmPhrase('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isConfirmed = isAcknowledged && confirmPhrase.trim().toUpperCase() === 'DELETE';

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    onConfirm();
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <div
        className="modal-dialog delete-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header delete-confirm-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge badge-danger">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="delete-confirm-title">Confirm Deletion</h2>
              <p className="modal-subtitle">Permanent removal of category records</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cancel and close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleExecute}>
          <div className="modal-body delete-confirm-body">
            <div className="delete-warning-callout">
              <p className="callout-lead">
                You are about to delete all data in category:
              </p>
              <div className="callout-target">
                <span className="target-badge">{categoryName}</span>
                <span className="target-stats">
                  <strong>{count}</strong> {itemType}
                  {totalAmount !== undefined && (
                    <> • <strong>{formatCurrency(totalAmount)}</strong> total</>
                  )}
                </span>
              </div>
              <p className="callout-disclaimer">
                This action is permanent and cannot be undone. Make sure you have exported a JSON
                backup if you wish to preserve these records.
              </p>
            </div>

            {/* Step 1: Checkbox Acknowledgment */}
            <div className="double-confirm-step">
              <label className="confirm-checkbox-label">
                <input
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  className="confirm-checkbox"
                />
                <span>
                  I understand that this action is irreversible and will permanently delete these{' '}
                  <strong>{count}</strong> records.
                </span>
              </label>
            </div>

            {/* Step 2: Confirmation Phrase */}
            <div className="double-confirm-step">
              <label htmlFor="confirm_delete_phrase" className="phrase-label">
                Type <strong>DELETE</strong> below to enable deletion:
              </label>
              <input
                id="confirm_delete_phrase"
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="phrase-input"
              />
            </div>
          </div>

          <div className="modal-footer delete-confirm-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed}
              className={`btn-danger-confirm ${isConfirmed ? 'active' : 'disabled'}`}
              title={isConfirmed ? 'Permanently delete records' : 'Complete confirmation steps to enable'}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Permanently Delete ({count})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
