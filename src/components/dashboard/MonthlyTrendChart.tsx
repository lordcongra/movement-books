/**
 * Monthly Financial Trends Bar Visualization
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import type { MonthlyTrendItem } from '../../types/pnl';
import { formatCurrency } from '../../utils/currencyMath';
import './MonthlyTrendChart.css';

interface MonthlyTrendChartProps {
  trends: MonthlyTrendItem[];
  year: number;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ trends, year }) => {
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  // Compute maximum amount across all 12 months to scale bar heights
  const maxVal = Math.max(
    ...trends.flatMap((t) => [t.revenue, t.expenses]),
    100
  );

  const activeTrend = trends.find((t) => t.monthKey === activeMonthKey);

  return (
    <div className="trend-card">
      <div className="trend-card-header">
        <div className="trend-title-wrap">
          <BarChart3 size={18} className="icon-accent" aria-hidden="true" />
          <h3 className="trend-title">Monthly Cash Flow Trends ({year})</h3>
        </div>
        <div className="trend-legend">
          <div className="legend-item">
            <span className="legend-swatch rev-swatch" aria-hidden="true" />
            <span>Cash Collections</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch exp-swatch" aria-hidden="true" />
            <span>Practice Expenses</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="chart-wrapper">
        <div className="chart-bars-container" role="region" aria-label="Monthly comparison bars">
          {trends.map((item) => {
            const revHeight = maxVal > 0 ? (item.revenue / maxVal) * 100 : 0;
            const expHeight = maxVal > 0 ? (item.expenses / maxVal) * 100 : 0;
            const isHovered = activeMonthKey === item.monthKey;

            return (
              <div
                key={item.monthKey}
                className={`chart-column ${isHovered ? 'column-active' : ''}`}
                onMouseEnter={() => setActiveMonthKey(item.monthKey)}
                onMouseLeave={() => setActiveMonthKey(null)}
                tabIndex={0}
                role="group"
                aria-label={`${item.monthName}: Revenue ${formatCurrency(item.revenue)}, Expenses ${formatCurrency(item.expenses)}`}
              >
                <div className="bars-track">
                  {/* Revenue Bar */}
                  <div
                    className="bar bar-revenue"
                    style={{
                      height: `${Math.max(revHeight, item.revenue > 0 ? 4 : 0)}%`,
                    }}
                    title={`Revenue: ${formatCurrency(item.revenue)}`}
                  />
                  {/* Expense Bar */}
                  <div
                    className="bar bar-expense"
                    style={{
                      height: `${Math.max(expHeight, item.expenses > 0 ? 4 : 0)}%`,
                    }}
                    title={`Expenses: ${formatCurrency(item.expenses)}`}
                  />
                </div>
                <span className="month-label">{item.monthName}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Detail Tooltip / Banner */}
        <div className="chart-tooltip-panel">
          {activeTrend ? (
            <div className="tooltip-active-content">
              <span className="tooltip-month">
                <strong>{activeTrend.monthName} {year} Details:</strong>
              </span>
              <span className="tooltip-stat rev-stat">
                Collections: <strong>{formatCurrency(activeTrend.revenue)}</strong>
              </span>
              <span className="tooltip-stat exp-stat">
                Expenses: <strong>{formatCurrency(activeTrend.expenses)}</strong>
              </span>
              <span className="tooltip-stat net-stat">
                Net: <strong>{formatCurrency(activeTrend.netProfit)}</strong>
              </span>
              <span className="tooltip-stat visit-stat">
                Visits: <strong>{activeTrend.visitCount}</strong>
              </span>
            </div>
          ) : (
            <div className="tooltip-placeholder">
              <Info size={14} aria-hidden="true" />
              <span>Hover over any month above to inspect exact cash collections, expenses, and net profit.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
