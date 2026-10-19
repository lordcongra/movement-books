/**
 * Expense Row Component
 * Displays a single expense with split status bar, deductible amounts, and actions.
 */

import React from 'react';
import {
  Scissors,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { ExpenseRecord } from '../../types/expense';
import { formatCurrency } from '../../utils/currencyMath';
import { formatDisplayDate } from '../../utils/dateUtils';

interface ExpenseRowProps {
  record: ExpenseRecord;
  onEditSplit: (record: ExpenseRecord) => void;
  onDelete: (id: string) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  record,
  onEditSplit,
  onDelete,
}) => {
  const displayDate = formatDisplayDate(record.date);
  const isUncategorized = record.category === 'Uncategorized';

  return (
    <tr className={`income-table-row ${record.isSplit ? 'row-split' : ''}`}>
      <td className="cell-date">
        <span className="primary-date">{displayDate}</span>
        {record.paymentMethod && (
          <span className="sub-date" title={`Payment Method: ${record.paymentMethod}`}>
            {record.paymentMethod}
          </span>
        )}
      </td>

      <td className="cell-description">
        <div className="desc-text" title={record.vendor}>
          <strong>{record.vendor}</strong>
        </div>
        <div className="practitioner-text" title={record.description}>
          {record.description}
        </div>
        {record.notes && (
          <div className="expense-notes-preview" title={record.notes}>
            Note: {record.notes}
          </div>
        )}
      </td>

      <td className="cell-category">
        {isUncategorized ? (
          <span
            className="status-badge badge-uncategorized"
            onClick={() => onEditSplit(record)}
            role="button"
            tabIndex={0}
            title="Click to assign a tax category"
          >
            <AlertCircle size={13} aria-hidden="true" />
            <span>Uncategorized</span>
          </span>
        ) : (
          <span className="status-badge badge-expense-cat" title={record.category}>
            <span>{record.category}</span>
          </span>
        )}
      </td>

      <td className="cell-split-status">
        {record.isSplit && record.splits.length > 0 ? (
          <div className="split-status-container">
            <div className="split-badge-label">
              <span className="split-badge split-badge-mixed">
                {record.splits.map((s) => `${s.percentage}% ${s.type === 'business' ? 'Biz' : 'Pers'}`).join(' / ')}
              </span>
            </div>
            <div className="split-math-bar" title={record.splits.map((s) => `${s.type}: ${formatCurrency(s.amount)} (${s.percentage}%)`).join(' | ')}>
              {record.splits.map((s) => (
                <div
                  key={s.id}
                  className={s.type === 'business' ? 'split-bar-biz' : 'split-bar-pers'}
                  style={{ width: `${s.percentage}%` }}
                />
              ))}
            </div>
          </div>
        ) : record.businessAmount === 0 ? (
          <span className="split-badge split-badge-personal">100% Personal</span>
        ) : (
          <span className="split-badge split-badge-full">100% Business</span>
        )}
      </td>

      <td className="cell-amount cell-invoiced">
        {formatCurrency(record.amount)}
      </td>

      <td className="cell-amount cell-paid">
        <span className="paid-amount-val">
          {formatCurrency(record.businessAmount)}
        </span>
        {record.isSplit && (
          <div className="sub-deductible-info">
            Pers: {formatCurrency(record.personalAmount)}
          </div>
        )}
      </td>

      <td className="cell-actions">
        <div className="action-buttons-group">
          <button
            type="button"
            className="row-action-btn edit-split-btn"
            onClick={() => onEditSplit(record)}
            aria-label={`Split or edit expense for ${record.vendor}`}
            title="Split transaction or change category"
          >
            <Scissors size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="row-delete-btn"
            onClick={() => onDelete(record.id)}
            aria-label={`Delete expense from ${record.vendor}`}
            title="Delete expense"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
};
