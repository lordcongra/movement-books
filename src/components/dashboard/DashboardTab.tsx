/**
 * Dashboard & P&L Summary Tab
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import {
  TrendingUp,
  Receipt,
  DollarSign,
  PieChart,
  Calendar,
} from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import { formatCurrency, sumAmounts, roundCurrency } from '../../utils/currencyMath';
import { getQuarterFromDate } from '../../utils/dateUtils';
import './DashboardTab.css';

export const DashboardTab: React.FC = () => {
  const records = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const expenses = useExpenseStore((state) => state.records);

  // Filter records by selected year
  const yearIncome = records.filter((r) => {
    const d = r.paidAt || r.invoiceDate;
    return d.startsWith(String(selectedYear)) && r.isCashBasisRevenue;
  });

  const yearExpenses = expenses.filter((e) => e.date.startsWith(String(selectedYear)));

  const grossRevenue = sumAmounts(yearIncome.map((r) => r.totalPaid));
  const businessExpenses = sumAmounts(yearExpenses.map((e) => e.businessAmount));
  const netIncome = roundCurrency(grossRevenue - businessExpenses);

  // Quarterly breakdown
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const quarterlyIncome = quarters.map((q) => {
    const qRecords = yearIncome.filter((r) => getQuarterFromDate(r.paidAt || r.invoiceDate) === q);
    const amount = sumAmounts(qRecords.map((r) => r.totalPaid));
    return { quarter: q, amount, count: qRecords.length };
  });

  // Revenue by visit category
  const categories = ['Evaluation', 'Follow-Up', 'Dry Needling', 'Cancellation'] as const;
  const categoryTotals = categories.map((cat) => {
    const catRecords = yearIncome.filter((r) => r.visitCategory === cat);
    const amount = sumAmounts(catRecords.map((r) => r.totalPaid));
    const percent = grossRevenue > 0 ? Math.round((amount / grossRevenue) * 100) : 0;
    return { category: cat, amount, count: catRecords.length, percent };
  });

  return (
    <div className="dashboard-container">
      {/* 1. Core P&L Overview Grid */}
      <div className="pnl-overview-grid">
        <div className="pnl-card pnl-card-gross">
          <div className="pnl-card-header">
            <span className="pnl-label">Cash Gross Revenue ({selectedYear})</span>
            <DollarSign size={20} color="var(--income-green)" aria-hidden="true" />
          </div>
          <div className="pnl-amount revenue">{formatCurrency(grossRevenue)}</div>
          <div className="pnl-desc">{yearIncome.length} collected visits (Cash Basis)</div>
        </div>

        <div className="pnl-card pnl-card-expense">
          <div className="pnl-card-header">
            <span className="pnl-label">Deductible Expenses</span>
            <Receipt size={20} color="var(--expense-red)" aria-hidden="true" />
          </div>
          <div className="pnl-amount expense">{formatCurrency(businessExpenses)}</div>
          <div className="pnl-desc">{yearExpenses.length} business expense items</div>
        </div>

        <div className="pnl-card pnl-card-net">
          <div className="pnl-card-header">
            <span className="pnl-label">Net Operating Income</span>
            <TrendingUp size={20} color="var(--primary)" aria-hidden="true" />
          </div>
          <div className="pnl-amount net">{formatCurrency(netIncome)}</div>
          <div className="pnl-desc">Schedule C Net Profit before self-employment tax</div>
        </div>
      </div>

      {/* 2. Breakdown Panels */}
      <div className="dashboard-details-grid">
        {/* Treatment Category Distribution */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <PieChart size={18} aria-hidden="true" />
              <span>Revenue by Service Type</span>
            </h3>
            <span className="pnl-desc">{selectedYear} Cash Basis</span>
          </div>

          <div className="breakdown-list">
            {categoryTotals.map((item) => (
              <div key={item.category}>
                <div className="breakdown-row">
                  <span className="breakdown-label">
                    {item.category} ({item.count})
                  </span>
                  <span className="breakdown-val">
                    {formatCurrency(item.amount)} ({item.percent}%)
                  </span>
                </div>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly P&L Distribution */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Calendar size={18} aria-hidden="true" />
              <span>Quarterly Cash Collections</span>
            </h3>
            <span className="pnl-desc">{selectedYear}</span>
          </div>

          <div className="breakdown-list">
            {quarterlyIncome.map((q) => {
              const percent = grossRevenue > 0 ? Math.round((q.amount / grossRevenue) * 100) : 0;
              return (
                <div key={q.quarter}>
                  <div className="breakdown-row">
                    <span className="breakdown-label">
                      {q.quarter} ({q.count} visits)
                    </span>
                    <span className="breakdown-val">
                      {formatCurrency(q.amount)} ({percent}%)
                    </span>
                  </div>
                  <div className="breakdown-bar-wrap">
                    <div
                      className="breakdown-bar"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: 'var(--emerald-accent)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
