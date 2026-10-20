/**
 * Income Table Component
 * Renders the table container and maps over invoice records.
 */

import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import type { EmbodiaInvoiceRecord } from '../../types/income';
import { IncomeRow } from './IncomeRow';

interface IncomeTableProps {
  records: EmbodiaInvoiceRecord[];
  onDeleteRecord: (id: string) => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({
  records,
  onDeleteRecord,
}) => {
  if (records.length === 0) {
    return (
      <div className="empty-table-state">
        <div className="empty-icon-wrap">
          <FileSpreadsheet size={36} aria-hidden="true" />
        </div>
        <h3>No income records to display</h3>
        <p>
          Upload an Embodia billing CSV export above to populate records.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive-wrapper">
      <table className="income-data-table">
        <thead>
          <tr>
            <th scope="col" className="th-date">Date</th>
            <th scope="col" className="th-desc">Description / Treatment</th>
            <th scope="col" className="th-cat">Category</th>
            <th scope="col" className="th-payment">Payment Method</th>
            <th scope="col" className="th-amount">Invoiced</th>
            <th scope="col" className="th-amount">Total Paid (Cash Basis)</th>
            <th scope="col" className="th-status">Status</th>
            <th scope="col" className="th-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <IncomeRow
              key={record.id}
              record={record}
              onDelete={onDeleteRecord}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
