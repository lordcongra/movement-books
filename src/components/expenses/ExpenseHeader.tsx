/**
 * Expense Summary Metric Cards Header
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  PieChart,
  HelpCircle,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import type { ExpenseRecord } from '../../types/expense';
import { formatCurrency, sumAmounts } from '../../utils/currencyMath';

interface ExpenseHeaderProps {
  records: ExpenseRecord[];
  selectedYear: number;
}

export const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({
  records,
  selectedYear,
}) => {
  const metrics = useMemo(() => {
    const yearRecords = records.filter((r) => r.date.startsWith(String(selectedYear)));

    const totalDeductions = sumAmounts(yearRecords.map((r) => r.businessAmount));
    const totalGross = sumAmounts(yearRecords.map((r) => r.amount));
    const splitRecords = yearRecords.filter((r) => r.isSplit);
    const uncategorizedRecords = yearRecords.filter((r) => r.category === 'Uncategorized');

    // Aggregate deductible spending by category
    const categoryTotals: Record<string, number> = {};
    for (const record of yearRecords) {
      if (record.isSplit && record.splits.length > 0) {
        for (const seg of record.splits) {
          if (seg.type === 'business' && seg.category !== 'Personal / Non-Deductible') {
            categoryTotals[seg.category] = (categoryTotals[seg.category] || 0) + seg.amount;
          }
        }
      } else if (
        record.category !== 'Uncategorized' &&
        record.category !== 'Personal / Non-Deductible' &&
        record.category !== 'Mixed / Split'
      ) {
        categoryTotals[record.category] = (categoryTotals[record.category] || 0) + record.businessAmount;
      }
    }

    let topCategory = 'None';
    let topCategoryAmount = 0;

    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    }

    return {
      yearRecordsCount: yearRecords.length,
      totalDeductions,
      totalGross,
      splitCount: splitRecords.length,
      uncategorizedCount: uncategorizedRecords.length,
      topCategory,
      topCategoryAmount,
    };
  }, [records, selectedYear]);

  return (
    <div className="income-metrics-grid">
      <div className="metric-card metric-primary">
        <div className="metric-header">
          <span className="metric-title">{selectedYear} Total Deductions</span>
          <div className="metric-icon-wrap icon-green">
            <CheckCircle2 size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{formatCurrency(metrics.totalDeductions)}</div>
        <div className="metric-footer">
          <span className="metric-subtext">Applied to IRS Schedule C Net Profit</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Top Expense Category</span>
          <div className="metric-icon-wrap icon-purple">
            <TrendingDown size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>
          {metrics.topCategory}
        </div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {metrics.topCategoryAmount > 0
              ? `${formatCurrency(metrics.topCategoryAmount)} deductible`
              : 'No categorized expenses'}
          </span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Split Transactions</span>
          <div className="metric-icon-wrap icon-blue">
            <PieChart size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{metrics.splitCount}</div>
        <div className="metric-footer">
          <span className="metric-subtext">Mixed Business / Personal apportioned</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Uncategorized Items</span>
          <div className={`metric-icon-wrap ${metrics.uncategorizedCount > 0 ? 'icon-amber' : 'icon-gray'}`}>
            <HelpCircle size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value" style={{ color: metrics.uncategorizedCount > 0 ? 'var(--warning, #f59e0b)' : 'inherit' }}>
          {metrics.uncategorizedCount}
        </div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {metrics.uncategorizedCount > 0
              ? 'Requires category assignment'
              : 'All transactions categorized'}
          </span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Gross Outflow</span>
          <div className="metric-icon-wrap icon-red">
            <Receipt size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{formatCurrency(metrics.totalGross)}</div>
        <div className="metric-footer">
          <span className="metric-subtext">{metrics.yearRecordsCount} total transactions</span>
        </div>
      </div>
    </div>
  );
};
