/**
 * Schedule C Expense Mapping Table
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import type { ScheduleCExpenseLine } from '../../types/pnl';
import { formatCurrency } from '../../utils/currencyMath';

interface ScheduleCTableProps {
  lines: ScheduleCExpenseLine[];
  totalDeductible: number;
  year: number;
}

export const ScheduleCTable: React.FC<ScheduleCTableProps> = ({
  lines,
  totalDeductible,
  year,
}) => {
  return (
    <div className="schedule-table-card">
      <div className="schedule-table-header">
        <div className="schedule-header-title">
          <FileText size={18} className="icon-accent" aria-hidden="true" />
          <div>
            <h3 className="table-title">IRS Schedule C (Form 1040) Expense Mapping ({year})</h3>
            <span className="table-subtitle">
              Physical therapy solo practice categorized deductions with split allocation tracking
            </span>
          </div>
        </div>
        <div className="schedule-header-badge">
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>IRS Compliant Categories</span>
        </div>
      </div>

      <div className="schedule-table-scroll">
        <table className="schedule-c-table" aria-label={`Schedule C Expenses for ${year}`}>
          <thead>
            <tr>
              <th scope="col" className="th-line">Schedule C Line</th>
              <th scope="col" className="th-cat">Tax Category</th>
              <th scope="col" className="th-examples">PT Practice Examples</th>
              <th scope="col" className="th-rate">Rate</th>
              <th scope="col" className="th-amount">Gross Spent</th>
              <th scope="col" className="th-amount">Allowable Deduction</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((item) => {
              const hasExpense = item.deductibleAmount > 0;
              const ratePercent = `${Math.round(item.deductibleRate * 100)}%`;

              return (
                <tr key={item.category} className={hasExpense ? 'row-active-expense' : ''}>
                  <td>
                    <span className="schedule-line-badge">{item.line}</span>
                  </td>
                  <td>
                    <div className="cat-name">{item.category}</div>
                    <div className="cat-desc">{item.description}</div>
                  </td>
                  <td className="cell-examples">{item.description}</td>
                  <td className="cell-rate">
                    <span className={`rate-pill ${item.deductibleRate < 1 ? 'rate-reduced' : ''}`}>
                      {ratePercent}
                    </span>
                  </td>
                  <td className="cell-amount">
                    <span className={item.grossAmount > 0 ? 'text-spent' : 'text-zero'}>
                      {formatCurrency(item.grossAmount)}
                    </span>
                  </td>
                  <td className="cell-amount cell-deductible">
                    <span className={hasExpense ? 'text-deductible' : 'text-zero'}>
                      {formatCurrency(item.deductibleAmount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="tfoot-total-row">
              <td colSpan={5} className="tfoot-label screen-only-cell">
                <strong>Line 28: Total Allowable Practice Expenses ({year})</strong>
              </td>
              <td colSpan={4} className="tfoot-label print-only-cell">
                <strong>Line 28: Total Allowable Practice Expenses ({year})</strong>
              </td>
              <td className="cell-amount tfoot-total-amount">
                <strong>{formatCurrency(totalDeductible)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
