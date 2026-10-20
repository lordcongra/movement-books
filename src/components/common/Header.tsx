/**
 * Application Top Navigation Header
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Receipt,
  FileSpreadsheet,
  Lock,
  Calendar,
  Database,
} from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import { BackupModal } from './BackupModal';
import './Header.css';

export type AppTab = 'dashboard' | 'income' | 'expenses' | 'tax';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const setSelectedYearIncome = useIncomeStore((state) => state.setSelectedYear);
  const setSelectedYearExpenses = useExpenseStore((state) => state.setSelectedYear);

  const handleYearChange = (newYear: number) => {
    setSelectedYearIncome(newYear);
    setSelectedYearExpenses(newYear);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="brand-section">
            <div className="brand-logo-icon" aria-hidden="true">
              <Activity size={22} />
            </div>
            <div className="brand-titles">
              <span className="brand-name">Movement Books</span>
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
              <span>Income</span>
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
            {/* Multi-Year Synchronized Selector */}
            <div className="year-selector" title="Active Tax Year">
              <Calendar size={14} aria-hidden="true" />
              <select
                className="year-select-input"
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                aria-label="Select tax year"
              >
                <option value={2027}>Tax Year 2027</option>
                <option value={2026}>Tax Year 2026</option>
                <option value={2025}>Tax Year 2025</option>
                <option value={2024}>Tax Year 2024</option>
              </select>
            </div>

            {/* Offline JSON Backup / Restore Trigger */}
            <button
              type="button"
              className="btn-header-backup"
              onClick={() => setIsBackupOpen(true)}
              aria-label="Open data management and backup modal"
              title="Export or restore client-side JSON backup"
            >
              <Database size={14} aria-hidden="true" />
              <span>Backup & Restore</span>
            </button>

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

      {/* Local-First Backup / Restore Modal */}
      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
};
