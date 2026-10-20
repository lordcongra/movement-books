/**
 * Estimated Self-Employment Tax Guidance Card
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import { ShieldAlert, CalendarClock, DollarSign, CheckCircle2 } from 'lucide-react';
import type { EstimatedTaxResult } from '../../types/pnl';
import { formatCurrency } from '../../utils/currencyMath';
import './EstimatedTaxCard.css';

interface EstimatedTaxCardProps {
  estimatedTax: EstimatedTaxResult;
  year: number;
}

export const EstimatedTaxCard: React.FC<EstimatedTaxCardProps> = ({ estimatedTax, year }) => {
  const { netProfit, seEarnings, seTaxTotal, quarterlyPayment, deadlines } = estimatedTax;

  return (
    <div className="est-tax-card">
      <div className="est-tax-header">
        <div className="est-tax-title-wrap">
          <CalendarClock size={20} className="icon-accent" aria-hidden="true" />
          <div>
            <h3 className="est-tax-title">IRS Estimated Self-Employment Tax Guidance ({year})</h3>
            <span className="est-tax-subtitle">Form 1040-ES & Schedule SE safe-harbor quarterly set-asides</span>
          </div>
        </div>
        <div className="est-tax-status-pill">
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>Solo PT Safe Harbor</span>
        </div>
      </div>

      <div className="est-tax-body">
        {/* Metric Summary Cards */}
        <div className="est-tax-metrics-row">
          <div className="est-metric-box">
            <span className="est-metric-lbl">Schedule C Net Profit</span>
            <span className="est-metric-val">{formatCurrency(netProfit)}</span>
            <span className="est-metric-sub">Gross income minus deductions</span>
          </div>

          <div className="est-metric-box">
            <span className="est-metric-lbl">SE Subject Earnings (92.35%)</span>
            <span className="est-metric-val">{formatCurrency(seEarnings)}</span>
            <span className="est-metric-sub">IRS Schedule SE statutory base</span>
          </div>

          <div className="est-metric-box">
            <span className="est-metric-lbl">Est. Annual SE Tax (15.3%)</span>
            <span className="est-metric-val highlight-tax">{formatCurrency(seTaxTotal)}</span>
            <span className="est-metric-sub">12.4% Soc Sec + 2.9% Medicare</span>
          </div>

          <div className="est-metric-box est-box-quarterly">
            <span className="est-metric-lbl">Quarterly Set-Aside (1/4)</span>
            <span className="est-metric-val highlight-quarterly">{formatCurrency(quarterlyPayment)}</span>
            <span className="est-metric-sub">Recommended safe-harbor payment</span>
          </div>
        </div>

        {/* 4 Quarterly Deadlines */}
        <div className="deadlines-container">
          <h4 className="deadlines-title">
            <DollarSign size={15} aria-hidden="true" />
            <span>IRS 1040-ES Quarterly Voucher Deadlines</span>
          </h4>
          <div className="deadlines-grid">
            {deadlines.map((dl) => (
              <div key={dl.quarter} className="deadline-card">
                <div className="deadline-head">
                  <span className="dl-quarter-tag">{dl.quarter} Voucher</span>
                  <span className="dl-due-date">{dl.dueDate}</span>
                </div>
                <div className="dl-amount">{formatCurrency(dl.amount)}</div>
                <div className="dl-period">Covers {dl.periodCovered}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe harbor compliance notice */}
        <div className="est-tax-notice">
          <ShieldAlert size={16} className="notice-icon" aria-hidden="true" />
          <div className="notice-text">
            <strong>PT Solo Practice Tax Advisory:</strong> Under IRC guidelines, solo physical therapists operating as single-member LLCs or sole proprietorships pay 15.3% Self-Employment (FICA) tax on 92.35% of net profit. These safe-harbor projections prevent IRS underpayment penalties. Consult your CPA to factor in personal income tax brackets and state quarterly requirements.
          </div>
        </div>
      </div>
    </div>
  );
};
