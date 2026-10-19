/**
 * Expenses & Split Transactions Tab
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import {
  Receipt,
  Sparkles,
  PieChart,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useExpenseStore } from '../../stores/expenseSlice';
import { formatCurrency, sumAmounts } from '../../utils/currencyMath';
import { formatDisplayDate } from '../../utils/dateUtils';
import './ExpenseTab.css';

export const ExpenseTab: React.FC = () => {
  const records = useExpenseStore((state) => state.records);
  const addExpense = useExpenseStore((state) => state.addExpense);
  const removeExpense = useExpenseStore((state) => state.removeExpense);

  const totalBusinessDeductible = sumAmounts(records.map((r) => r.businessAmount));
  const totalGrossExpense = sumAmounts(records.map((r) => r.amount));

  const handleLoadSampleExpenses = () => {
    // 1. 100% Business CEU Expense
    addExpense({
      date: '2026-01-12',
      vendor: 'MedBridge Education',
      description: 'Annual Clinical Continuing Education & EMR Subscriptions',
      amount: 375.0,
      isSplit: false,
      splits: [],
      category: 'Continuing Education & Training',
      paymentMethod: 'Credit Card (Business)',
    });

    // 2. Mixed Split Expense: Cell Phone (60% Business / 40% Personal)
    addExpense({
      date: '2026-01-15',
      vendor: 'Verizon Wireless',
      description: 'Monthly Smartphone Plan for Telehealth & Patient Coordination',
      amount: 120.0,
      isSplit: true,
      splits: [
        {
          id: 'sp_1',
          type: 'business',
          amount: 72.0,
          percentage: 60,
          category: 'Utilities & Phone',
          notes: '60% PT practice patient scheduling & clinic calls',
        },
        {
          id: 'sp_2',
          type: 'personal',
          amount: 48.0,
          percentage: 40,
          category: 'Personal / Non-Deductible',
          notes: '40% personal usage',
        },
      ],
      category: 'Mixed / Split',
      paymentMethod: 'Credit Card',
    });

    // 3. 100% Clinical Supplies (Dry Needling needles)
    addExpense({
      date: '2026-02-04',
      vendor: 'Lhasa OMS',
      description: 'Seirin Dry Needling Needles & Sharps Container',
      amount: 94.5,
      isSplit: false,
      splits: [],
      category: 'Office Expense & Supplies',
      paymentMethod: 'Credit Card (Business)',
    });
  };

  return (
    <div className="expense-tab-container">
      {/* Information Banner */}
      <div className="expense-info-banner">
        <div className="info-banner-icon">
          <PieChart size={22} aria-hidden="true" />
        </div>
        <div className="info-banner-content">
          <h3>Split Transaction Invariant Engine</h3>
          <p>
            For solo PT practices, mixed expenses (e.g. cell phone, vehicle mileage, home office internet)
            require exact mathematical apportionment. The system enforces the invariant:{' '}
            <code>sum(splits) === originalAmount</code> with cents-safe precision math to ensure
            audit-proof Schedule C deductions.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="income-metrics-grid">
        <div className="metric-card metric-primary">
          <div className="metric-header">
            <span className="metric-title">Tax Deductible Business Total</span>
            <div className="metric-icon-wrap icon-green">
              <CheckCircle2 size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(totalBusinessDeductible)}</div>
          <div className="metric-footer">
            <span className="metric-subtext">Applied directly to Schedule C Net Profit</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Gross Outflow</span>
            <div className="metric-icon-wrap icon-red">
              <Receipt size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(totalGrossExpense)}</div>
          <div className="metric-footer">
            <span className="metric-subtext">{records.length} tracked expense transactions</span>
          </div>
        </div>
      </div>

      {/* Controls & Sample Button */}
      <div className="income-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="sample-data-btn"
            onClick={handleLoadSampleExpenses}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Load Sample PT Expenses (CEU, Verizon Split, Lhasa OMS)</span>
          </button>
        </div>
        <div className="toolbar-right">
          <span className="record-count-text">
            <strong>{records.length}</strong> expense records
          </span>
        </div>
      </div>

      {/* Expense Table */}
      {records.length === 0 ? (
        <div className="empty-table-state">
          <div className="empty-icon-wrap">
            <Receipt size={36} aria-hidden="true" />
          </div>
          <h3>No expenses recorded yet</h3>
          <p>
            Click <strong>Load Sample PT Expenses</strong> above to preview split transactions and Schedule C categories.
          </p>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="income-data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Vendor & Description</th>
                <th scope="col">Category</th>
                <th scope="col">Split Status</th>
                <th scope="col" className="th-amount">Total Amount</th>
                <th scope="col" className="th-amount">Business Deductible</th>
                <th scope="col" className="th-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((exp) => (
                <tr key={exp.id} className="income-table-row">
                  <td className="cell-date">
                    <span className="primary-date">{formatDisplayDate(exp.date)}</span>
                  </td>
                  <td className="cell-description">
                    <div className="desc-text">{exp.vendor}</div>
                    <div className="practitioner-text">{exp.description}</div>
                  </td>
                  <td>
                    <span className="status-badge badge-other">{exp.category}</span>
                  </td>
                  <td>
                    {exp.isSplit ? (
                      <div>
                        <span className="split-badge split-badge-mixed">
                          Split ({exp.splits.map((s) => `${s.percentage}% ${s.type}`).join(' / ')})
                        </span>
                        <div className="split-math-bar">
                          {exp.splits.map((s) => (
                            <div
                              key={s.id}
                              className={s.type === 'business' ? 'split-bar-biz' : 'split-bar-pers'}
                              style={{ width: `${s.percentage}%` }}
                              title={`${s.type}: ${formatCurrency(s.amount)} (${s.percentage}%)`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="split-badge split-badge-full">100% Business</span>
                    )}
                  </td>
                  <td className="cell-amount cell-invoiced">{formatCurrency(exp.amount)}</td>
                  <td className="cell-amount cell-paid">
                    <span className="paid-amount-val">{formatCurrency(exp.businessAmount)}</span>
                  </td>
                  <td className="cell-actions">
                    <button
                      type="button"
                      className="row-delete-btn"
                      onClick={() => removeExpense(exp.id)}
                      aria-label={`Delete expense from ${exp.vendor}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
