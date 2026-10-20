/**
 * Single Row in Embodia Income Table
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { EmbodiaInvoiceRecord } from '../../types/income';
import { formatCurrency } from '../../utils/currencyMath';
import { formatDisplayDate } from '../../utils/dateUtils';
import { CategoryBadge, PaymentBadge, CashBasisBadge } from '../common/StatusBadge';

interface IncomeRowProps {
  record: EmbodiaInvoiceRecord;
  onDelete: (id: string) => void;
}

export const IncomeRow: React.FC<IncomeRowProps> = ({ record, onDelete }) => {
  const displayDate = record.paidAt
    ? formatDisplayDate(record.paidAt)
    : formatDisplayDate(record.invoiceDate);

  return (
    <tr className={`income-table-row ${record.isCashBasisRevenue ? 'row-cash' : 'row-pending'}`}>
      <td className="cell-date">
        <span className="primary-date">{displayDate}</span>
        {record.rawPaidAt && record.rawPaidAt !== record.rawInvoiceDate && (
          <span className="sub-date" title="Invoice Date">
            Inv: {formatDisplayDate(record.invoiceDate)}
          </span>
        )}
      </td>

      <td className="cell-description">
        <div className="desc-text" title={record.description}>
          <span>{record.description || 'Physical Therapy Session'}</span>
          {(record.source === 'manual' || record.invoiceNumber?.startsWith('MAN-')) && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--text-accent)',
                marginLeft: '6px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              Manual
            </span>
          )}
        </div>
        {record.patient && record.patient !== 'Direct Client' && (
          <div className="practitioner-text">Client: {record.patient}</div>
        )}
        {record.practitioner && record.practitioner !== 'Self' && (
          <div className="practitioner-text">Practitioner: {record.practitioner}</div>
        )}
        {record.notes && (
          <div className="practitioner-text" style={{ fontStyle: 'italic', opacity: 0.85 }}>
            Note: {record.notes}
          </div>
        )}
      </td>

      <td className="cell-category">
        <CategoryBadge category={record.visitCategory} />
      </td>

      <td className="cell-payment">
        <PaymentBadge method={record.paymentMethod} />
      </td>

      <td className="cell-amount cell-invoiced">
        {formatCurrency(record.total)}
      </td>

      <td className="cell-amount cell-paid">
        <span className="paid-amount-val">
          {formatCurrency(record.totalPaid)}
        </span>
      </td>

      <td className="cell-status">
        <CashBasisBadge isRecognized={record.isCashBasisRevenue} />
      </td>

      <td className="cell-actions">
        <button
          type="button"
          className="row-delete-btn"
          onClick={() => onDelete(record.id)}
          aria-label={`Delete record from ${displayDate}`}
          title="Delete record"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
};
