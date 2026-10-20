/**
 * Movement Books — Main Application Orchestrator
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState } from 'react';
import { Header, type AppTab } from './components/common/Header';
import { IncomeTab } from './components/income/IncomeTab';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { ExpenseTab } from './components/expenses/ExpenseTab';
import { TaxReportTab } from './components/tax/TaxReportTab';
import './App.css';

const CURRENT_YEAR = new Date().getFullYear();

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('income');

  return (
    <div className="app-layout">
      {/* 1. Header with branding, navigation tabs, and year selector */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Main Tab View Router */}
      <main className="main-content" role="main">
        {activeTab === 'income' && <IncomeTab />}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'expenses' && <ExpenseTab />}
        {activeTab === 'tax' && <TaxReportTab />}
      </main>

      {/* 3. Subtle Local-First Privacy Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span>© {CURRENT_YEAR} Movement Books.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="footer-right">
            <span>Client-side local persistence active</span>
            <span>•</span>
            <span>Zero external API telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
