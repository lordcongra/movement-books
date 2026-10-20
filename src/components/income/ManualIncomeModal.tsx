/**
 * Manual Income Entry Modal
 * Allows logging non-Embodia income (cash, check, direct payments, workshops, consulting).
 */

import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import type { ManualIncomeInput, PaymentMethod, VisitCategory } from '../../types/income';

interface ManualIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (income: ManualIncomeInput) => void;
}

function getTodayIso(): string {
  return new Date().toISOString().substring(0, 10);
}

export const ManualIncomeModal: React.FC<ManualIncomeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [date, setDate] = useState(getTodayIso);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [patient, setPatient] = useState('');
  const [category, setCategory] = useState<VisitCategory>('Follow-Up');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaid, setIsPaid] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [practitioner, setPractitioner] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalAmount = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalAmount <= 0) {
      alert('Please enter a valid positive income amount.');
      return;
    }

    const desc = description.trim() || `${category} - ${paymentMethod}`;

    onAdd({
      date,
      amount: totalAmount,
      description: desc,
      patient: patient.trim() || undefined,
      visitCategory: category,
      paymentMethod,
      isPaid,
      invoiceNumber: invoiceNumber.trim() || undefined,
      practitioner: practitioner.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="manual-income-title">
      <div className="modal-dialog manual-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--income-green)' }}>
              <PlusCircle size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="manual-income-title">Log Non-Embodia Income</h2>
              <p className="modal-subtitle">Record cash, check, workshops, or direct non-Embodia client payments</p>
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
                <label htmlFor="manual_inc_date">Payment / Service Date *</label>
                <div className="input-with-icon">
                  <input
                    id="manual_inc_date"
                    type="date"
                    className="modal-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="manual_inc_amount">Amount Received ($) *</label>
                <input
                  id="manual_inc_amount"
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
                <label htmlFor="manual_inc_cat">Visit / Revenue Category *</label>
                <select
                  id="manual_inc_cat"
                  className="modal-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VisitCategory)}
                >
                  <option value="Evaluation">Evaluation</option>
                  <option value="Follow-Up">Follow-Up</option>
                  <option value="Dry Needling">Dry Needling</option>
                  <option value="Cancellation">Cancellation Fee</option>
                  <option value="Other">Other / Consulting / Workshop</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="manual_inc_payment">Payment Method *</label>
                <select
                  id="manual_inc_payment"
                  className="modal-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Stripe">Stripe (Direct / Outside Embodia)</option>
                  <option value="Other">Other (Zelle, Venmo, Wire)</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="manual_inc_client">Client / Patient Name (Optional)</label>
                <input
                  id="manual_inc_client"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  className="modal-input"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="manual_inc_ref">Invoice / Reference # (Optional)</label>
                <input
                  id="manual_inc_ref"
                  type="text"
                  placeholder="e.g. INV-101 or Check #402"
                  className="modal-input"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="manual_inc_pract">Practitioner / Provider (Optional)</label>
              <input
                id="manual_inc_pract"
                type="text"
                placeholder="e.g. Self"
                className="modal-input"
                value={practitioner}
                onChange={(e) => setPractitioner(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="manual_inc_desc">Service / Treatment Description</label>
              <input
                id="manual_inc_desc"
                type="text"
                placeholder="e.g., Cash Physical Therapy Follow-Up, Ergonomic Workshop"
                className="modal-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--income-green)' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  Payment Collected (Recognize immediately as Cash-Basis Revenue)
                </span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="manual_inc_notes">Notes / Details (Optional)</label>
              <textarea
                id="manual_inc_notes"
                rows={2}
                placeholder="Additional notes for bookkeeping or tax preparation..."
                className="modal-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                backgroundColor: 'var(--income-green)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span>Log Income</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
