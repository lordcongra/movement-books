/**
 * Dashboard & P&L Summary Tab Orchestrator
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useMemo } from 'react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import {
  computeQuarterlyPnl,
  computeMonthlyTrends,
  computeEstimatedTax,
} from '../../utils/pnlCalculations';
import { getYearFromDate } from '../../utils/dateUtils';
import { DashboardOverview } from './DashboardOverview';
import { QuarterlyPnlTable } from './QuarterlyPnlTable';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { EstimatedTaxCard } from './EstimatedTaxCard';
import './DashboardTab.css';

export const DashboardTab: React.FC = () => {
  // Leaf Zustand store selectors to prevent re-render cascades
  const incomeRecords = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const expenseRecords = useExpenseStore((state) => state.records);

  // Compute pure financial figures memoized by records and selectedYear
  const quarterlyPnl = useMemo(() => {
    return computeQuarterlyPnl(incomeRecords, expenseRecords, selectedYear);
  }, [incomeRecords, expenseRecords, selectedYear]);

  const trends = useMemo(() => {
    return computeMonthlyTrends(incomeRecords, expenseRecords, selectedYear);
  }, [incomeRecords, expenseRecords, selectedYear]);

  const estimatedTax = useMemo(() => {
    return computeEstimatedTax(quarterlyPnl.ytd.netProfit, selectedYear);
  }, [quarterlyPnl.ytd.netProfit, selectedYear]);

  // Count deductible items for current year
  const yearExpenseCount = useMemo(() => {
    return expenseRecords.filter((e) => getYearFromDate(e.date) === selectedYear).length;
  }, [expenseRecords, selectedYear]);

  return (
    <div className="dashboard-container" role="tabpanel" aria-label="Financial Dashboard">
      {/* 1. Core High-Level KPI Cards */}
      <DashboardOverview
        grossRevenue={quarterlyPnl.ytd.grossRevenue}
        totalExpenses={quarterlyPnl.ytd.businessExpenses}
        netProfit={quarterlyPnl.ytd.netProfit}
        profitMargin={quarterlyPnl.ytd.profitMargin}
        visitCount={quarterlyPnl.ytd.visitCount}
        expenseCount={yearExpenseCount}
        year={selectedYear}
      />

      {/* 2. Quarterly Performance Matrix Table */}
      <QuarterlyPnlTable quarterlyPnl={quarterlyPnl} />

      {/* 3. Monthly Visual Trend Chart (12 Months) */}
      <MonthlyTrendChart trends={trends} year={selectedYear} />

      {/* 4. IRS Estimated Self-Employment Tax Guidance Card */}
      <EstimatedTaxCard estimatedTax={estimatedTax} year={selectedYear} />
    </div>
  );
};
