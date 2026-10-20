/**
 * Dashboard Overview KPI Cards
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import {
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyMath';

interface DashboardOverviewProps {
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  visitCount: number;
  expenseCount: number;
  year: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  grossRevenue,
  totalExpenses,
  netProfit,
  profitMargin,
  visitCount,
  expenseCount,
  year,
}) => {
  const isProfitable = netProfit >= 0;

  return (
    <div className="pnl-overview-grid" aria-label="Key Financial Performance Indicators">
      {/* 1. Cash Gross Revenue */}
      <div className="pnl-card pnl-card-gross">
        <div className="pnl-card-header">
          <span className="pnl-label">Cash Gross Revenue ({year})</span>
          <div className="pnl-icon-badge badge-green" aria-hidden="true">
            <DollarSign size={18} />
          </div>
        </div>
        <div className="pnl-amount revenue">{formatCurrency(grossRevenue)}</div>
        <div className="pnl-desc">
          <span>{visitCount} collected patient visits</span>
          <span className="pnl-tag">Cash Basis</span>
        </div>
      </div>

      {/* 2. Total Practice Deductions */}
      <div className="pnl-card pnl-card-expense">
        <div className="pnl-card-header">
          <span className="pnl-label">Total Practice Deductions</span>
          <div className="pnl-icon-badge badge-red" aria-hidden="true">
            <Receipt size={18} />
          </div>
        </div>
        <div className="pnl-amount expense">{formatCurrency(totalExpenses)}</div>
        <div className="pnl-desc">
          <span>{expenseCount} deductible business items</span>
          <span className="pnl-tag">Schedule C</span>
        </div>
      </div>

      {/* 3. Net Schedule C Profit */}
      <div className="pnl-card pnl-card-net">
        <div className="pnl-card-header">
          <span className="pnl-label">Net Schedule C Profit</span>
          <div
            className={`pnl-icon-badge ${isProfitable ? 'badge-primary' : 'badge-red'}`}
            aria-hidden="true"
          >
            {isProfitable ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
        </div>
        <div className={`pnl-amount ${isProfitable ? 'net' : 'expense'}`}>
          {formatCurrency(netProfit)}
        </div>
        <div className="pnl-desc">
          <span>Ordinary net income before self-employment tax</span>
        </div>
      </div>

      {/* 4. Profit Margin % */}
      <div className="pnl-card pnl-card-margin">
        <div className="pnl-card-header">
          <span className="pnl-label">Operating Profit Margin</span>
          <div className="pnl-icon-badge badge-indigo" aria-hidden="true">
            <Percent size={18} />
          </div>
        </div>
        <div className="pnl-amount margin">{profitMargin.toFixed(1)}%</div>
        <div className="pnl-desc">
          <span>
            {grossRevenue === 0
              ? 'No revenue recorded'
              : profitMargin >= 50
              ? 'Strong operating health'
              : 'Moderate operational margin'}
          </span>
        </div>
      </div>
    </div>
  );
};
