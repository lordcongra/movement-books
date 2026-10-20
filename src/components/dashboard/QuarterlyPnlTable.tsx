/**
 * Quarterly P&L Matrix Table Component
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import type { QuarterlyPnlResult } from '../../types/pnl';
import { formatCurrency } from '../../utils/currencyMath';
import './QuarterlyPnlTable.css';

interface QuarterlyPnlTableProps {
  quarterlyPnl: QuarterlyPnlResult;
}

export const QuarterlyPnlTable: React.FC<QuarterlyPnlTableProps> = ({ quarterlyPnl }) => {
  const { quarters, ytd, year } = quarterlyPnl;

  return (
    <div className="quarterly-card">
      <div className="quarterly-card-header">
        <div className="quarterly-title-wrap">
          <Calendar size={18} className="icon-accent" aria-hidden="true" />
          <h3 className="quarterly-title">Quarterly Performance & P&L Matrix ({year})</h3>
        </div>
        <div className="quarterly-badge">
          <Layers size={13} aria-hidden="true" />
          <span>Accrual-Free Cash Accounting</span>
        </div>
      </div>

      <div className="quarterly-table-wrapper">
        <table className="quarterly-table" aria-label={`Quarterly Financial Matrix for ${year}`}>
          <thead>
            <tr>
              <th scope="col" className="col-metric">Financial Metric</th>
              {quarters.map((q) => (
                <th key={q.quarter} scope="col" className="col-q">
                  <div className="q-head-name">{q.quarter}</div>
                  <div className="q-head-sub">{q.months}</div>
                </th>
              ))}
              <th scope="col" className="col-ytd">
                <div className="q-head-name">Full Year</div>
                <div className="q-head-sub">{year} YTD</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Cash Gross Revenue */}
            <tr>
              <th scope="row" className="row-metric-label">
                <span className="metric-indicator rev-dot" aria-hidden="true" />
                <span>Cash Gross Revenue</span>
              </th>
              {quarters.map((q) => (
                <td key={q.quarter} className="cell-num rev-cell">
                  {formatCurrency(q.grossRevenue)}
                </td>
              ))}
              <td className="cell-num rev-cell ytd-cell">
                {formatCurrency(ytd.grossRevenue)}
              </td>
            </tr>

            {/* Row 2: Practice Deductions */}
            <tr>
              <th scope="row" className="row-metric-label">
                <span className="metric-indicator exp-dot" aria-hidden="true" />
                <span>Practice Deductions</span>
              </th>
              {quarters.map((q) => (
                <td key={q.quarter} className="cell-num exp-cell">
                  {formatCurrency(q.businessExpenses)}
                </td>
              ))}
              <td className="cell-num exp-cell ytd-cell">
                {formatCurrency(ytd.businessExpenses)}
              </td>
            </tr>

            {/* Row 3: Net Operating Profit */}
            <tr className="row-highlight">
              <th scope="row" className="row-metric-label">
                <span className="metric-indicator net-dot" aria-hidden="true" />
                <strong>Net Schedule C Profit</strong>
              </th>
              {quarters.map((q) => {
                const isNeg = q.netProfit < 0;
                return (
                  <td
                    key={q.quarter}
                    className={`cell-num ${isNeg ? 'neg-cell' : 'net-cell'}`}
                  >
                    <strong>{formatCurrency(q.netProfit)}</strong>
                  </td>
                );
              })}
              <td
                className={`cell-num ytd-cell ${
                  ytd.netProfit < 0 ? 'neg-cell' : 'net-cell'
                }`}
              >
                <strong>{formatCurrency(ytd.netProfit)}</strong>
              </td>
            </tr>

            {/* Row 4: Profit Margin % */}
            <tr>
              <th scope="row" className="row-metric-label">
                <span className="metric-indicator margin-dot" aria-hidden="true" />
                <span>Operating Margin %</span>
              </th>
              {quarters.map((q) => (
                <td key={q.quarter} className="cell-num margin-cell">
                  {q.grossRevenue > 0 ? `${q.profitMargin.toFixed(1)}%` : '—'}
                </td>
              ))}
              <td className="cell-num margin-cell ytd-cell">
                {ytd.grossRevenue > 0 ? `${ytd.profitMargin.toFixed(1)}%` : '—'}
              </td>
            </tr>

            {/* Row 5: Completed Patient Visits */}
            <tr>
              <th scope="row" className="row-metric-label">
                <span className="metric-indicator visit-dot" aria-hidden="true" />
                <span>Completed Patient Visits</span>
              </th>
              {quarters.map((q) => (
                <td key={q.quarter} className="cell-num visit-cell">
                  {q.visitCount} visits
                </td>
              ))}
              <td className="cell-num visit-cell ytd-cell">
                {ytd.visitCount} visits
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
