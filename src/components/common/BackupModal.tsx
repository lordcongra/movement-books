/**
 * Local-First JSON Backup & Restore Modal
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
} from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import type { EmbodiaInvoiceRecord } from '../../types/income';
import type { ExpenseRecord } from '../../types/expense';
import './BackupModal.css';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupPayload {
  version: string;
  app: string;
  practice: string;
  exportedAt: string;
  activeYear?: number;
  incomeRecords: EmbodiaInvoiceRecord[];
  expenseRecords: ExpenseRecord[];
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const incomeRecords = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const restoreIncome = useIncomeStore((state) => state.restoreRecords);
  const setSelectedYearIncome = useIncomeStore((state) => state.setSelectedYear);

  const expenseRecords = useExpenseStore((state) => state.records);
  const restoreExpenses = useExpenseStore((state) => state.restoreExpenses);
  const setSelectedYearExpenses = useExpenseStore((state) => state.setSelectedYear);

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const payload: BackupPayload = {
        version: '1.0',
        app: 'Movement Books',
        practice: 'Pride In Movement Physical Therapy',
        exportedAt: now.toISOString(),
        activeYear: selectedYear,
        incomeRecords,
        expenseRecords,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `movement-books-backup-${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: `Backup exported successfully (${incomeRecords.length} income, ${expenseRecords.length} expense records).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Failed to export backup: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  };

  // Handle Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Partial<BackupPayload>;

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON file format.');
        }

        const restoredIncome = Array.isArray(parsed.incomeRecords) ? parsed.incomeRecords : [];
        const restoredExpenses = Array.isArray(parsed.expenseRecords) ? parsed.expenseRecords : [];

        if (restoredIncome.length === 0 && restoredExpenses.length === 0) {
          throw new Error('Backup file contains no income or expense records.');
        }

        // Restore into stores
        restoreIncome(restoredIncome);
        restoreExpenses(restoredExpenses);

        if (parsed.activeYear && typeof parsed.activeYear === 'number') {
          setSelectedYearIncome(parsed.activeYear);
          setSelectedYearExpenses(parsed.activeYear);
        }

        setFeedback({
          type: 'success',
          message: `Successfully restored ${restoredIncome.length} income records and ${restoredExpenses.length} expense items!`,
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          message: `Restore failed: ${err instanceof Error ? err.message : 'Invalid backup schema'}`,
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="modal-content backup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Database size={20} className="icon-primary" aria-hidden="true" />
            <div>
              <h3 id="backup-modal-title" className="modal-title">
                Data Management & Local-First Backup
              </h3>
              <span className="modal-subtitle">
                Export and restore your encrypted-at-rest local financial records
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close data management modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {/* Feedback banner if available */}
          {feedback && (
            <div
              className={`backup-feedback-banner ${
                feedback.type === 'success' ? 'banner-success' : 'banner-error'
              }`}
              role="alert"
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} aria-hidden="true" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="backup-sections-grid">
            {/* 1. Export Card */}
            <div className="backup-card">
              <div className="backup-card-icon icon-download-wrap">
                <Download size={22} aria-hidden="true" />
              </div>
              <h4 className="backup-card-title">Export Complete Backup (JSON)</h4>
              <p className="backup-card-desc">
                Creates an offline JSON snapshot containing all {incomeRecords.length} Embodia
                invoices, {expenseRecords.length} bank/Stripe expenses, and split allocations.
              </p>
              <button
                type="button"
                className="btn-backup-action btn-export-json"
                onClick={handleExport}
              >
                <FileJson size={16} aria-hidden="true" />
                <span>Export All Data (.json)</span>
              </button>
            </div>

            {/* 2. Restore Card */}
            <div className="backup-card">
              <div className="backup-card-icon icon-upload-wrap">
                <Upload size={22} aria-hidden="true" />
              </div>
              <h4 className="backup-card-title">Restore Backup (JSON)</h4>
              <p className="backup-card-desc">
                Upload a previously saved Movement Books JSON backup to restore all financial records
                into your browser.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                aria-label="Upload JSON backup file"
              />
              <button
                type="button"
                className="btn-backup-action btn-restore-json"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} aria-hidden="true" />
                <span>Select Backup File...</span>
              </button>
            </div>
          </div>

          <div className="backup-guarantee-note">
            <ShieldCheck size={16} className="text-emerald" aria-hidden="true" />
            <span>
              <strong>Zero Cloud Leakage:</strong> Exports are generated strictly in memory inside
              your browser. No financial data is ever transmitted across external networks.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
