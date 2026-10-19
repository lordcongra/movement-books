/**
 * Application Top Navigation Header
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import {
  Activity,
  BarChart3,
  Receipt,
  FileSpreadsheet,
  Lock,
  Calendar,
} from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeSlice';
import './Header.css';

export type AppTab = 'dashboard' | 'income' | 'expenses' | 'tax';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const setSelectedYear = useIncomeStore((state) => state.setSelectedYear);

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-logo-icon" aria-hidden="true">
            <Activity size={22} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">Pride In Movement PT</span>
            <span className="brand-subtitle">Financial & Tax Management</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
            aria-selected={activeTab === 'dashboard'}
            role="tab"
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span>Dashboard / P&L</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => onSelectTab('income')}
            aria-selected={activeTab === 'income'}
            role="tab"
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            <span>Income (Embodia)</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => onSelectTab('expenses')}
            aria-selected={activeTab === 'expenses'}
            role="tab"
          >
            <Receipt size={16} aria-hidden="true" />
            <span>Expenses & Splits</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'tax' ? 'active' : ''}`}
            onClick={() => onSelectTab('tax')}
            aria-selected={activeTab === 'tax'}
            role="tab"
          >
            <Activity size={16} aria-hidden="true" />
            <span>Tax Report</span>
          </button>
        </nav>

        <div className="header-actions">
          <div className="year-selector" title="Active Tax Year">
            <Calendar size={14} aria-hidden="true" />
            <select
              className="year-select-input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select tax year"
            >
              <option value={2026}>Tax Year 2026</option>
              <option value={2025}>Tax Year 2025</option>
              <option value={2024}>Tax Year 2024</option>
            </select>
          </div>

          <div
            className="privacy-badge"
            title="All financial data is processed and stored strictly in your browser. Zero cloud upload."
          >
            <Lock size={12} aria-hidden="true" />
            <span>100% Client-Side</span>
          </div>
        </div>
      </div>
    </header>
  );
};
