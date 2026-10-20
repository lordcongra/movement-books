/**
 * Tax Report Header KPI Metrics
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyMath';

interface TaxHeaderMetricsProps {
  grossRevenue: number;
  totalDeductibleExpenses: number;
  netScheduleCProfit: number;
  seTaxTotal: number;
  year: number;
}

export const TaxHeaderMetrics: React.FC<TaxHeaderMetricsProps> = ({
  grossRevenue,
  totalDeductibleExpenses,
  netScheduleCProfit,
  seTaxTotal,
  year,
}) => {
  return (
    <div className="tax-metrics-grid" aria-label="Schedule C Summary Metrics">
      {/* 1. Part I: Line 1 Gross Receipts */}
      <div className="tax-metric-card">
        <div className="tax-metric-header">
          <span className="tax-metric-title">Part I: Gross Receipts (Line 1)</span>
          <div className="tax-icon-wrap icon-green" aria-hidden="true">
            <DollarSign size={18} />
          </div>
        </div>
        <div className="tax-metric-value">{formatCurrency(grossRevenue)}</div>
        <div className="tax-metric-footer">
          <span>{year} cash basis collected client receipts</span>
        </div>
      </div>

      {/* 2. Part II: Line 28 Total Expenses */}
      <div className="tax-metric-card">
        <div className="tax-metric-header">
          <span className="tax-metric-title">Part II: Total Expenses (Line 28)</span>
          <div className="tax-icon-wrap icon-red" aria-hidden="true">
            <TrendingDown size={18} />
          </div>
        </div>
        <div className="tax-metric-value">{formatCurrency(totalDeductibleExpenses)}</div>
        <div className="tax-metric-footer">
          <span>Allowable PT practice deductions</span>
        </div>
      </div>

      {/* 3. Part II: Line 31 Net Profit */}
      <div className="tax-metric-card highlight-profit">
        <div className="tax-metric-header">
          <span className="tax-metric-title">Part II: Net Profit (Line 31)</span>
          <div className="tax-icon-wrap icon-indigo" aria-hidden="true">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="tax-metric-value">{formatCurrency(netScheduleCProfit)}</div>
        <div className="tax-metric-footer">
          <span>Schedule C taxable business income</span>
        </div>
      </div>

      {/* 4. Schedule SE Estimated Tax */}
      <div className="tax-metric-card">
        <div className="tax-metric-header">
          <span className="tax-metric-title">Schedule SE Est. Tax (15.3%)</span>
          <div className="tax-icon-wrap icon-gold" aria-hidden="true">
            <Calculator size={18} />
          </div>
        </div>
        <div className="tax-metric-value text-gold">{formatCurrency(seTaxTotal)}</div>
        <div className="tax-metric-footer">
          <span>Self-Employment (FICA) tax set-aside</span>
        </div>
      </div>
    </div>
  );
};
