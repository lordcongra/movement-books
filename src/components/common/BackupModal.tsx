/**
 * Local-First JSON Backup & Restore Modal
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  GitMerge,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useIncomeStore } from '../../stores/incomeSlice';
import { useExpenseStore } from '../../stores/expenseSlice';
import type { EmbodiaInvoiceRecord } from '../../types/income';
import type { ExpenseRecord } from '../../types/expense';
import { sumAmounts } from '../../utils/currencyMath';
import { TAX_CATEGORIES } from '../../utils/taxCategories';
import { DeleteConfirmModal } from './DeleteConfirmModal';
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
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [purgeTarget, setPurgeTarget] = useState<string>('INCOME_ALL');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const incomeRecords = useIncomeStore((state) => state.records);
  const selectedYear = useIncomeStore((state) => state.selectedYear);
  const mergeIncome = useIncomeStore((state) => state.mergeRecords);
  const restoreIncome = useIncomeStore((state) => state.restoreRecords);
  const clearCategoryIncome = useIncomeStore((state) => state.clearCategoryRecords);
  const setSelectedYearIncome = useIncomeStore((state) => state.setSelectedYear);

  const expenseRecords = useExpenseStore((state) => state.records);
  const mergeExpenses = useExpenseStore((state) => state.mergeExpenses);
  const restoreExpenses = useExpenseStore((state) => state.restoreExpenses);
  const clearCategoryExpense = useExpenseStore((state) => state.clearCategoryExpenses);
  const setSelectedYearExpenses = useExpenseStore((state) => state.setSelectedYear);

  const purgeInfo = useMemo(() => {
    if (purgeTarget.startsWith('INCOME_')) {
      const cat = purgeTarget.replace('INCOME_', '');
      const recs =
        cat === 'ALL'
          ? incomeRecords
          : incomeRecords.filter((r) => r.visitCategory === cat);
      return {
        name: cat === 'ALL' ? 'All Income Records' : `${cat} Income`,
        count: recs.length,
        total: sumAmounts(recs.map((r) => r.totalPaid)),
        type: 'income' as const,
        execute: () => clearCategoryIncome(cat as any),
      };
    } else {
      const cat = purgeTarget.replace('EXPENSE_', '');
      const recs =
        cat === 'ALL'
          ? expenseRecords
          : expenseRecords.filter((r) => {
              if (cat === 'Uncategorized') return r.category === 'Uncategorized';
              if (cat === 'Mixed / Split') return r.isSplit || r.category === 'Mixed / Split';
              if (cat === 'Personal / Non-Deductible') {
                return r.category === 'Personal / Non-Deductible' || r.personalAmount > 0;
              }
              return (
                r.category === cat ||
                (r.isSplit && r.splits?.some((s) => s.category === cat))
              );
            });
      return {
        name: cat === 'ALL' ? 'All Expense Records' : `${cat} Expenses`,
        count: recs.length,
        total: sumAmounts(recs.map((r) => r.amount)),
        type: 'expense' as const,
        execute: () => clearCategoryExpense(cat),
      };
    }
  }, [purgeTarget, incomeRecords, expenseRecords, clearCategoryIncome, clearCategoryExpense]);

  const handleConfirmPurge = () => {
    const deletedCount = purgeInfo.count;
    const deletedName = purgeInfo.name;
    purgeInfo.execute();
    setFeedback({
      type: 'success',
      message: `Successfully deleted ${deletedCount} records from ${deletedName}.`,
    });
  };

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const payload: BackupPayload = {
        version: '1.0',
        app: 'Movement Books',
        practice: 'Movement Books',
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

        if (restoreMode === 'merge') {
          const incRes = mergeIncome(restoredIncome);
          const expRes = mergeExpenses(restoredExpenses);

          const incDupeText =
            incRes.duplicates > 0
              ? ` (${incRes.duplicates} duplicate${incRes.duplicates === 1 ? '' : 's'} skipped)`
              : '';
          const expDupeText =
            expRes.duplicates > 0
              ? ` (${expRes.duplicates} duplicate${expRes.duplicates === 1 ? '' : 's'} skipped)`
              : '';
          const expUpdatedText = expRes.updated > 0 ? `, ${expRes.updated} updated` : '';

          setFeedback({
            type: 'success',
            message: `Merge complete! Added ${incRes.added} income${incDupeText} and ${expRes.added} expense items${expDupeText}${expUpdatedText}.`,
          });
        } else {
          // Replace All mode
          restoreIncome(restoredIncome);
          restoreExpenses(restoredExpenses);

          if (parsed.activeYear && typeof parsed.activeYear === 'number') {
            setSelectedYearIncome(parsed.activeYear);
            setSelectedYearExpenses(parsed.activeYear);
          }

          setFeedback({
            type: 'success',
            message: `Successfully replaced all data with ${restoredIncome.length} income records and ${restoredExpenses.length} expense items!`,
          });
        }

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

              {/* Mode Selection */}
              <div className="restore-mode-selector">
                <span className="restore-mode-label">Restore Mode</span>
                <div className="restore-mode-options" role="radiogroup" aria-label="Restore Mode">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={restoreMode === 'merge'}
                    className={`btn-restore-mode ${restoreMode === 'merge' ? 'active' : ''}`}
                    onClick={() => setRestoreMode('merge')}
                  >
                    <GitMerge size={13} aria-hidden="true" />
                    <span>Merge</span>
                    <span className="restore-mode-badge">Sync</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={restoreMode === 'replace'}
                    className={`btn-restore-mode ${restoreMode === 'replace' ? 'active' : ''}`}
                    onClick={() => setRestoreMode('replace')}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    <span>Replace All</span>
                  </button>
                </div>
              </div>

              <p className="backup-card-desc">
                {restoreMode === 'merge'
                  ? 'Merges backup data with current records. Automatically skips duplicates using deterministic hashes so you can safely sync between phone and desktop.'
                  : 'Completely replaces all current local income and expense records with the records in the backup file.'}
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
                <span>
                  {restoreMode === 'merge' ? 'Select File to Merge...' : 'Select File to Replace All...'}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Category Data Purge Card with Double-Confirm */}
          <div
            className="backup-card"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.25)',
              backgroundColor: 'rgba(239, 68, 68, 0.03)',
            }}
          >
            <div
              className="backup-card-icon"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--expense-red)' }}
            >
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <h4 className="backup-card-title">Delete Data by Category</h4>
            <p className="backup-card-desc">
              Permanently purge all records in a selected income or expense category with double-confirmation safeguards.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <label htmlFor="purge_cat_select" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select Category to Purge:
              </label>
              <select
                id="purge_cat_select"
                className="modal-select"
                value={purgeTarget}
                onChange={(e) => setPurgeTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  backgroundColor: 'var(--card-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.875rem',
                }}
              >
                <optgroup label="Income Categories">
                  <option value="INCOME_ALL">All Income Records ({incomeRecords.length})</option>
                  <option value="INCOME_Evaluation">Evaluation</option>
                  <option value="INCOME_Follow-Up">Follow-Up</option>
                  <option value="INCOME_Dry Needling">Dry Needling</option>
                  <option value="INCOME_Cancellation">Cancellation</option>
                  <option value="INCOME_Other">Other / Workshops / Consulting</option>
                </optgroup>
                <optgroup label="Expense Categories">
                  <option value="EXPENSE_ALL">All Expense Records ({expenseRecords.length})</option>
                  <option value="EXPENSE_Uncategorized">⚠️ Uncategorized</option>
                  <option value="EXPENSE_Mixed / Split">✂️ Mixed / Split</option>
                  {TAX_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={`EXPENSE_${cat.id}`}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="EXPENSE_Personal / Non-Deductible">Personal / Non-Deductible</option>
                </optgroup>
              </select>

              <button
                type="button"
                className="btn-backup-action"
                disabled={purgeInfo.count === 0}
                onClick={() => setIsPurgeModalOpen(true)}
                style={{
                  backgroundColor: purgeInfo.count === 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--expense-red)',
                  color: purgeInfo.count === 0 ? 'var(--text-muted)' : '#ffffff',
                  cursor: purgeInfo.count === 0 ? 'not-allowed' : 'pointer',
                  marginTop: '0.25rem',
                }}
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>
                  {purgeInfo.count === 0
                    ? 'No Records in Selected Category'
                    : `Delete ${purgeInfo.count} Records in ${purgeInfo.name}...`}
                </span>
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

      {/* Double-Confirmation Modal for Category Purge */}
      <DeleteConfirmModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onConfirm={handleConfirmPurge}
        categoryName={purgeInfo.name}
        count={purgeInfo.count}
        totalAmount={purgeInfo.total}
        itemType={purgeInfo.type}
      />
    </div>
  );
};
