/**
 * Expense Table Component
 * Renders the table container and maps over expense records.
 */

import React from 'react';
import { Receipt } from 'lucide-react';
import type { ExpenseRecord } from '../../types/expense';
import { ExpenseRow } from './ExpenseRow';

interface ExpenseTableProps {
  records: ExpenseRecord[];
  onEditSplit: (record: ExpenseRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  records,
  onEditSplit,
  onDeleteRecord,
}) => {
  if (records.length === 0) {
    return (
      <div className="empty-table-state">
        <div className="empty-icon-wrap">
          <Receipt size={36} aria-hidden="true" />
        </div>
        <h3>No expense records found</h3>
        <p>
          Import a bank statement CSV or click <strong>Add Manual Expense</strong> to record expenses.
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
            <th scope="col" className="th-desc">Vendor & Description</th>
            <th scope="col" className="th-cat">Tax Category</th>
            <th scope="col" className="th-split">Split Status</th>
            <th scope="col" className="th-amount">Total Outflow</th>
            <th scope="col" className="th-amount">Business Deductible</th>
            <th scope="col" className="th-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <ExpenseRow
              key={record.id}
              record={record}
              onEditSplit={onEditSplit}
              onDelete={onDeleteRecord}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
