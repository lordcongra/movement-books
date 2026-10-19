/**
 * Tax Report & Schedule C Mapping Tab
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import {
  ShieldCheck,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { TAX_CATEGORIES } from '../../utils/taxCategories';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import { formatCurrency, sumAmounts, roundCurrency } from '../../utils/currencyMath';
import './TaxReportTab.css';

export const TaxReportTab: React.FC = () => {
  const records = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const expenses = useExpenseStore((state) => state.records);

  // Cash basis revenue for selected year
  const yearIncome = records.filter((r) => {
    const d = r.paidAt || r.invoiceDate;
    return d.startsWith(String(selectedYear)) && r.isCashBasisRevenue;
  });
  const grossRevenue = sumAmounts(yearIncome.map((r) => r.totalPaid));

  // Business deductible expenses
  const yearExpenses = expenses.filter((e) => e.date.startsWith(String(selectedYear)));
  const totalDeductibleExpenses = sumAmounts(yearExpenses.map((e) => e.businessAmount));
  const netScheduleCProfit = roundCurrency(grossRevenue - totalDeductibleExpenses);

  // Compute total spent per category
  const expenseByCategory: Record<string, number> = {};
  yearExpenses.forEach((exp) => {
    const cat = exp.category;
    expenseByCategory[cat] = roundCurrency((expenseByCategory[cat] || 0) + exp.businessAmount);
  });

  return (
    <div className="tax-tab-container">
      {/* 1. Privacy Invariant Notice */}
      <div className="tax-privacy-card">
        <div className="tax-privacy-icon">
          <ShieldCheck size={24} aria-hidden="true" />
        </div>
        <div className="tax-privacy-body">
          <h3>100% Client-Side Privacy Guarantee</h3>
          <p>
            Your financial records, patient names, and tax documents remain strictly on your local
            device. No data is ever transmitted to remote cloud databases or third-party servers.
          </p>
        </div>
      </div>

      {/* 2. Schedule C Summary Metrics */}
      <div className="income-metrics-grid">
        <div className="metric-card metric-primary">
          <div className="metric-header">
            <span className="metric-title">Part I: Gross Receipts (Line 1)</span>
            <div className="metric-icon-wrap icon-green">
              <DollarSign size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(grossRevenue)}</div>
          <div className="metric-footer">
            <span className="metric-subtext">Cash basis recognized revenue</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Part II: Total Expenses (Line 28)</span>
            <div className="metric-icon-wrap icon-red">
              <TrendingDown size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(totalDeductibleExpenses)}</div>
          <div className="metric-footer">
            <span className="metric-subtext">Sum of allowable PT practice deductions</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Part II: Net Profit (Line 31)</span>
            <div className="metric-icon-wrap icon-indigo">
              <TrendingUp size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(netScheduleCProfit)}</div>
          <div className="metric-footer">
            <span className="metric-subtext">Subject to Self-Employment Tax (Schedule SE)</span>
          </div>
        </div>
      </div>

      {/* 3. Schedule C Category Mapping Table */}
      <div className="table-responsive-wrapper">
        <div style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} aria-hidden="true" />
            <span>IRS Schedule C (Form 1040) Expense Mapping</span>
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Categorized deductions tailored for solo physical therapy practitioners.
          </p>
        </div>

        <table className="schedule-c-table">
          <thead>
            <tr>
              <th scope="col">Schedule C Line</th>
              <th scope="col">Expense Category</th>
              <th scope="col">Typical PT Practice Items</th>
              <th scope="col" className="th-amount">Deduction Total</th>
            </tr>
          </thead>
          <tbody>
            {TAX_CATEGORIES.map((cat) => {
              const currentTotal = expenseByCategory[cat.id] || 0;
              return (
                <tr key={cat.id}>
                  <td>
                    <span className="schedule-line-badge">{cat.scheduleCLine}</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{cat.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {cat.description}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {cat.typicalExamples}
                  </td>
                  <td className="cell-amount">
                    <span style={{ fontWeight: currentTotal > 0 ? 700 : 400, color: currentTotal > 0 ? 'var(--income-green)' : 'var(--text-muted)' }}>
                      {formatCurrency(currentTotal)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
