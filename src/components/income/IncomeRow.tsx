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
          {record.description || 'Physical Therapy Session'}
        </div>
        {record.practitioner && (
          <div className="practitioner-text">Practitioner: {record.practitioner}</div>
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
