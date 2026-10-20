/**
 * Tax Report & Schedule C Mapping Tab Orchestrator
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import {
  calculateCategoryExpenses,
  calculateScheduleCLines,
  computeEstimatedTax,
  generateScheduleCCsv,
} from '../../utils/pnlCalculations';
import { sumAmounts, toCents, fromCents } from '../../utils/currencyMath';
import { getYearFromDate } from '../../utils/dateUtils';
import { TaxHeaderMetrics } from './TaxHeaderMetrics';
import { ScheduleCTable } from './ScheduleCTable';
import { TaxToolbar } from './TaxToolbar';
import './TaxReportTab.css';

export const TaxReportTab: React.FC = () => {
  const records = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const expenses = useExpenseStore((state) => state.records);

  // 1. Filter cash basis income for selected tax year
  const yearIncome = useMemo(() => {
    return records.filter((r) => {
      const d = r.paidAt || r.invoiceDate;
      return getYearFromDate(d) === selectedYear && r.isCashBasisRevenue;
    });
  }, [records, selectedYear]);

  const grossRevenue = useMemo(() => {
    return sumAmounts(yearIncome.map((r) => r.totalPaid));
  }, [yearIncome]);

  // 2. Filter expenses for selected tax year
  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => getYearFromDate(e.date) === selectedYear);
  }, [expenses, selectedYear]);

  // 3. Compute Schedule C breakdown with split transaction accumulation
  const categoryTotals = useMemo(() => {
    return calculateCategoryExpenses(yearExpenses);
  }, [yearExpenses]);

  const { lines, totalDeductible } = useMemo(() => {
    return calculateScheduleCLines(categoryTotals);
  }, [categoryTotals]);

  const netScheduleCProfit = useMemo(() => {
    const revCents = toCents(grossRevenue);
    const expCents = toCents(totalDeductible);
    return fromCents(revCents - expCents);
  }, [grossRevenue, totalDeductible]);

  const estimatedTax = useMemo(() => {
    return computeEstimatedTax(netScheduleCProfit, selectedYear);
  }, [netScheduleCProfit, selectedYear]);

  // 4. CSV Download Action
  const handleExportCsv = () => {
    const csvContent = generateScheduleCCsv(
      selectedYear,
      grossRevenue,
      categoryTotals,
      netScheduleCProfit
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `movement-books-schedule-c-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 5. Window Print Action
  const handlePrint = () => {
    window.print();
  };

  const [currentDateFormatted] = useState(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  });

  return (
    <div className="tax-tab-container" role="tabpanel" aria-label="Tax Report Tab">
      {/* Print-Only Professional CPA Header */}
      <div className="print-only-statement-header">
        <div className="print-header-top">
          <div>
            <div className="print-practice-name">Pride In Movement Physical Therapy</div>
            <div className="print-doc-title">
              IRS Form 1040 Schedule C Annual Financial Statement
            </div>
          </div>
          <div className="print-meta-right">
            <div><strong>Tax Year:</strong> {selectedYear}</div>
            <div><strong>Accounting Basis:</strong> Cash Basis</div>
            <div><strong>Date Generated:</strong> {currentDateFormatted}</div>
          </div>
        </div>
      </div>

      {/* 1. Screen-Only Client-Side Privacy Notice */}
      <div className="tax-privacy-card">
        <div className="tax-privacy-icon">
          <ShieldCheck size={22} aria-hidden="true" />
        </div>
        <div className="tax-privacy-body">
          <h3>100% Client-Side Privacy Guarantee</h3>
          <p>
            Your financial records, patient names, and tax documents remain strictly on your local
            device. No data is ever transmitted to remote cloud databases or third-party servers.
          </p>
        </div>
      </div>

      {/* 2. Action Toolbar (CSV Export & Print) */}
      <TaxToolbar
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
        year={selectedYear}
      />

      {/* 3. High-Level Schedule C Metrics */}
      <TaxHeaderMetrics
        grossRevenue={grossRevenue}
        totalDeductibleExpenses={totalDeductible}
        netScheduleCProfit={netScheduleCProfit}
        seTaxTotal={estimatedTax.seTaxTotal}
        year={selectedYear}
      />

      {/* 4. Categorized Schedule C Table */}
      <ScheduleCTable
        lines={lines}
        totalDeductible={totalDeductible}
        year={selectedYear}
      />

      {/* Print-Only Signature Section */}
      <div className="print-only-signature-section">
        <p className="signature-disclaimer">
          Under penalties of perjury, I declare that I have examined this annual financial summary,
          including accompanying tax categories and deductions, and to the best of my knowledge and
          belief, they are true, correct, and complete for the {selectedYear} calendar tax year.
        </p>
        <div className="signature-grid">
          <div className="signature-box">
            <span>Practitioner / Taxpayer Signature</span>
            <span>Date</span>
          </div>
          <div className="signature-box">
            <span>CPA / Reviewer Signature</span>
            <span>Date</span>
          </div>
        </div>
      </div>
    </div>
  );
};
