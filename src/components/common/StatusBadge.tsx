/**
 * Status Badge Component
 * Accessible badges for Visit Categories, Payment Methods, and Cash Basis status.
 */

import React from 'react';
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  FileCheck2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { PaymentMethod, VisitCategory } from '../../types/income';
import './StatusBadge.css';

interface CategoryBadgeProps {
  category: VisitCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  switch (category) {
    case 'Evaluation':
      return (
        <span className="status-badge badge-eval">
          <Activity size={13} aria-hidden="true" />
          <span>Evaluation</span>
        </span>
      );
    case 'Follow-Up':
      return (
        <span className="status-badge badge-followup">
          <CalendarCheck size={13} aria-hidden="true" />
          <span>Follow-Up</span>
        </span>
      );
    case 'Dry Needling':
      return (
        <span className="status-badge badge-dryneedling">
          <Activity size={13} aria-hidden="true" />
          <span>Dry Needling</span>
        </span>
      );
    case 'Cancellation':
      return (
        <span className="status-badge badge-cancellation">
          <XCircle size={13} aria-hidden="true" />
          <span>Late Cancel</span>
        </span>
      );
    default:
      return (
        <span className="status-badge badge-other">
          <HelpCircle size={13} aria-hidden="true" />
          <span>Other</span>
        </span>
      );
  }
};

interface PaymentBadgeProps {
  method: PaymentMethod;
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({ method }) => {
  switch (method) {
    case 'Stripe':
      return (
        <span className="status-badge badge-stripe">
          <CreditCard size={13} aria-hidden="true" />
          <span>Stripe</span>
        </span>
      );
    case 'Check':
      return (
        <span className="status-badge badge-check">
          <FileCheck2 size={13} aria-hidden="true" />
          <span>Check</span>
        </span>
      );
    case 'Cash':
      return (
        <span className="status-badge badge-cash">
          <Banknote size={13} aria-hidden="true" />
          <span>Cash</span>
        </span>
      );
    default:
      return (
        <span className="status-badge badge-other">
          <HelpCircle size={13} aria-hidden="true" />
          <span>{method}</span>
        </span>
      );
  }
};

interface CashBasisBadgeProps {
  isRecognized: boolean;
}

export const CashBasisBadge: React.FC<CashBasisBadgeProps> = ({ isRecognized }) => {
  if (isRecognized) {
    return (
      <span className="status-badge badge-cash-basis-yes" title="Recognized on cash basis (Paid in Full)">
        <CheckCircle2 size={13} aria-hidden="true" />
        <span>Cash Basis</span>
      </span>
    );
  }

  return (
    <span className="status-badge badge-cash-basis-no" title="Unpaid or Pending — Excluded from cash basis">
      <AlertCircle size={13} aria-hidden="true" />
      <span>Pending</span>
    </span>
  );
};
