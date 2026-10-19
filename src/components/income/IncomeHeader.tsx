/**
 * Income Summary Metric Cards Header
 * Displays Cash-Basis Revenue and visit category counts.
 */

import React from 'react';
import {
  DollarSign,
  Users,
  Activity,
  CalendarCheck,
  Zap,
  XCircle,
} from 'lucide-react';
import type { EmbodiaInvoiceRecord } from '../../types/income';
import { formatCurrency, sumAmounts } from '../../utils/currencyMath';

interface IncomeHeaderProps {
  records: EmbodiaInvoiceRecord[];
  selectedYear: number;
}

export const IncomeHeader: React.FC<IncomeHeaderProps> = ({
  records,
  selectedYear,
}) => {
  // Filter by selected year
  const yearRecords = records.filter((r) => {
    const d = r.paidAt || r.invoiceDate;
    return d.startsWith(String(selectedYear));
  });

  const cashRecords = yearRecords.filter((r) => r.isCashBasisRevenue);
  const totalCashRevenue = sumAmounts(cashRecords.map((r) => r.totalPaid));
  const totalInvoiced = sumAmounts(yearRecords.map((r) => r.total));

  // Category counts & amounts
  const evals = cashRecords.filter((r) => r.visitCategory === 'Evaluation');
  const followUps = cashRecords.filter((r) => r.visitCategory === 'Follow-Up');
  const needling = cashRecords.filter((r) => r.visitCategory === 'Dry Needling');
  const cancellations = cashRecords.filter((r) => r.visitCategory === 'Cancellation');

  return (
    <div className="income-metrics-grid">
      <div className="metric-card metric-primary">
        <div className="metric-header">
          <span className="metric-title">{selectedYear} Cash Revenue</span>
          <div className="metric-icon-wrap icon-green">
            <DollarSign size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{formatCurrency(totalCashRevenue)}</div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {cashRecords.length} paid visits recognized on cash basis
          </span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Total Invoiced</span>
          <div className="metric-icon-wrap icon-indigo">
            <Users size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{formatCurrency(totalInvoiced)}</div>
        <div className="metric-footer">
          <span className="metric-subtext">{yearRecords.length} total invoice entries</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Evaluations</span>
          <div className="metric-icon-wrap icon-purple">
            <Activity size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{evals.length}</div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {formatCurrency(sumAmounts(evals.map((e) => e.totalPaid)))} collected
          </span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Follow-Ups</span>
          <div className="metric-icon-wrap icon-blue">
            <CalendarCheck size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{followUps.length}</div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {formatCurrency(sumAmounts(followUps.map((e) => e.totalPaid)))} collected
          </span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Dry Needling</span>
          <div className="metric-icon-wrap icon-amber">
            <Zap size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{needling.length}</div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {formatCurrency(sumAmounts(needling.map((e) => e.totalPaid)))} collected
          </span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Cancellations</span>
          <div className="metric-icon-wrap icon-red">
            <XCircle size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="metric-value">{cancellations.length}</div>
        <div className="metric-footer">
          <span className="metric-subtext">
            {formatCurrency(sumAmounts(cancellations.map((e) => e.totalPaid)))} collected
          </span>
        </div>
      </div>
    </div>
  );
};
