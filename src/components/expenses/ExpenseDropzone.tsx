/**
 * Expense Dropzone & CSV Importer
 * Supports Bank Statement CSVs, Stripe Activity Exports, and instant sample loaders.
 */

import { useState, useRef, useImperativeHandle, forwardRef, type DragEvent, type ChangeEvent } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Building2,
  CreditCard,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { parseBankCsv } from '../../utils/bankParser';
import { parseStripeCsv } from '../../utils/stripeParser';
import { formatCurrency } from '../../utils/currencyMath';
import { useExpenseStore } from '../../stores/expenseSlice';

const SAMPLE_BANK_CSV = `Posting Date,Description,Amount,Type,Balance
2026-01-01,Pride In Movement Studio Sublease Rent,-1200.00,Debit,45000.00
2026-01-05,STRIPE PAYOUT PRIDE IN MOVEMENT,525.00,Credit,45525.00
2026-01-12,MedBridge Annual PT CEU Subscription,-375.00,Debit,45150.00
2026-01-15,Verizon Wireless PT Clinic Mobile Phone,-120.00,Debit,45030.00
2026-01-20,CLIENT CHECK DEPOSIT - J. DOE,200.00,Credit,45230.00
2026-02-04,Lhasa OMS Dry Needling Needles & Supplies,-94.50,Debit,45135.50
2026-02-10,Google Workspace Telehealth & Domain,-18.00,Debit,45117.50
2026-02-15,HPSO Malpractice Liability Insurance Premium,-485.00,Debit,44632.50
2026-02-28,Commercial Account Monthly Maintenance Fee,-15.00,Debit,44617.50
2026-03-01,Pride In Movement Studio Sublease Rent,-1200.00,Debit,43417.50
2026-03-08,PATIENT CASH DEPOSIT,200.00,Credit,43617.50
2026-03-14,Clinton Industries Hi-Lo PT Treatment Table,-850.00,Debit,42767.50
2026-03-22,Shell Oil - Patient Home Visit Fuel,-45.00,Debit,42722.50
2026-03-29,APTA Professional Association Annual Dues,-295.00,Debit,42427.50`;

const SAMPLE_STRIPE_CSV = `id,Created (UTC),Description,Amount,Fee,Net,Currency,Type,Status
txn_1Qk001,2026-01-05 14:32:00,Payment from Riley Shea Patient - PT Follow-Up,175.00,5.38,169.62,usd,charge,Available
txn_1Qk002,2026-01-08 10:15:00,Payment from Patient - PT Initial Evaluation,200.00,6.10,193.90,usd,charge,Available
txn_1Qk003,2026-01-27 16:45:00,Payment - Short Notice Cancellation Fee,175.00,5.38,169.62,usd,charge,Available
txn_1Qk004,2026-04-03 11:20:00,Payment - Dry Needling Session,70.00,2.33,67.67,usd,charge,Available
txn_1Qk005,2026-04-09 09:00:00,Payment from Patient - PT Initial Evaluation,200.00,6.10,193.90,usd,charge,Available
txn_1Qk006,2026-05-14 15:30:00,Payment from Patient - PT Follow-Up Visit,175.00,5.38,169.62,usd,charge,Available
txn_1Qk007,2026-06-21 11:00:00,Payment from Patient - PT Follow-Up Visit,175.00,5.38,169.62,usd,charge,Available`;

const SAMPLE_EXPENSE_SHEET_CSV = `Name,Cost ($),Category
01/06/2026 Panera Bread Team Lunch,$45.80,Food
MedBridge Annual PT CEU Renewal,$375.00,Education
01/13/2026 Smartpress Rack Cards & Marketing Flyers,$124.50,Marketing
Cricut Vinyl & EasyPress clinic signage,$89.20,Supplies
Namecheap PT domain registration,$18.00,Software & Subscriptions
Tablecloth,$0.00,Supplies
Make-A-Wish Foundation Charitable Donation,$50.00,Donation`;

interface ImportStatus {
  type: 'success' | 'warning' | 'error';
  message: string;
  details?: {
    added: number;
    duplicates: number;
    amount: number;
    filteredDeposits?: number;
  };
}

export interface ExpenseDropzoneHandle {
  triggerBankUpload: () => void;
  triggerStripeUpload: () => void;
}

export const ExpenseDropzone = forwardRef<ExpenseDropzoneHandle>((_, ref) => {
  const addExpenses = useExpenseStore((state) => state.addExpenses);
  const selectedYear = useExpenseStore((state) => state.selectedYear);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  useImperativeHandle(ref, () => ({
    triggerBankUpload: () => fileInputRef.current?.click(),
    triggerStripeUpload: () => fileInputRef.current?.click(),
  }));

  const processCsvText = (csvText: string, filename: string) => {
    setIsProcessing(true);
    setImportStatus(null);

    try {
      const headerLine = (csvText.split('\n')[0] || '').toLowerCase();
      const isStripe = headerLine.includes('fee') || headerLine.includes('balance transaction');

      if (isStripe) {
        const stripeRes = parseStripeCsv(csvText);

        if (stripeRes.errors.length > 0 && stripeRes.records.length === 0) {
          setImportStatus({
            type: 'error',
            message: `Stripe import error: ${stripeRes.errors.join(' ')}`,
          });
          setIsProcessing(false);
          return;
        }

        const { added, duplicates } = addExpenses(stripeRes.records);

        if (added === 0 && duplicates > 0) {
          setImportStatus({
            type: 'warning',
            message: `All ${duplicates} Stripe fee records in "${filename}" were already imported.`,
            details: { added: 0, duplicates, amount: 0 },
          });
        } else {
          setImportStatus({
            type: 'success',
            message: `Imported ${added} Stripe processing fee record${added === 1 ? '' : 's'} (${formatCurrency(stripeRes.totalFees)} total fees).`,
            details: { added, duplicates, amount: stripeRes.totalFees },
          });
        }
      } else {
        // Parse as Bank Statement or Google Sheets Expense / Food Log
        const bankRes = parseBankCsv(csvText, { filename, defaultYear: selectedYear });

        if (bankRes.errors.length > 0 && bankRes.records.length === 0) {
          setImportStatus({
            type: 'error',
            message: `Import error: ${bankRes.errors.join(' ')}`,
          });
          setIsProcessing(false);
          return;
        }

        const { added, duplicates, updated } = addExpenses(bankRes.records);
        const isFood = /food|meal/i.test(filename);
        const logType = isFood ? 'food & meal log' : 'expense';

        if (added === 0 && updated === 0 && duplicates > 0) {
          setImportStatus({
            type: 'warning',
            message: `All ${duplicates} ${logType} records in "${filename}" were already imported with their current categories.`,
            details: { added: 0, duplicates, amount: 0, filteredDeposits: bankRes.depositsSkipped },
          });
        } else if (updated > 0 && added === 0) {
          setImportStatus({
            type: 'success',
            message: `Updated ${updated} existing record${updated === 1 ? '' : 's'} in "${filename}" to ${isFood ? 'Meals (Tax Deductible)' : 'their updated category'}.${bankRes.depositsSkipped > 0 ? ` Filtered out ${bankRes.depositsSkipped} deposit row${bankRes.depositsSkipped === 1 ? '' : 's'}.` : ''}`,
            details: {
              added: 0,
              duplicates,
              amount: bankRes.totalExpenseAmount,
              filteredDeposits: bankRes.depositsSkipped,
            },
          });
        } else {
          const updateMsg = updated > 0 ? ` (and updated ${updated} existing records to ${isFood ? 'Meals (Tax Deductible)' : 'new category'})` : '';
          setImportStatus({
            type: 'success',
            message: `Imported ${added} ${logType} record${added === 1 ? '' : 's'}${updateMsg} (${formatCurrency(bankRes.totalExpenseAmount)} total).${bankRes.depositsSkipped > 0 ? ` Filtered out ${bankRes.depositsSkipped} deposit/credit row${bankRes.depositsSkipped === 1 ? '' : 's'}.` : ''}`,
            details: {
              added,
              duplicates,
              amount: bankRes.totalExpenseAmount,
              filteredDeposits: bankRes.depositsSkipped,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error processing expense CSV:', err);
      setImportStatus({
        type: 'error',
        message: `Failed to process "${filename}": ${err instanceof Error ? err.message : 'Unknown parse error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      readAndProcessFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      readAndProcessFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readAndProcessFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processCsvText(text, file.name);
      }
    };
    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: `Could not read file "${file.name}".`,
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="dropzone-card">
      <div
        className={`dropzone-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload Bank or Stripe CSV"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="dropzone-icon-container">
          {isProcessing ? (
            <Loader2 className="spinner" size={36} aria-hidden="true" />
          ) : (
            <UploadCloud size={36} aria-hidden="true" />
          )}
        </div>

        <div className="dropzone-text-group">
          <p className="dropzone-main-text">
            <strong>Click to upload</strong> or drag and drop Bank, Stripe, or Google Sheets CSV
          </p>
          <p className="dropzone-sub-text">
            Auto-detects bank debits, Stripe fees, and Google Sheets expense/food logs. 100% client-side privacy.
          </p>
        </div>

        <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="sample-data-btn"
            onClick={() => processCsvText(SAMPLE_BANK_CSV, 'bank-sample.csv')}
            disabled={isProcessing}
            title="Load built-in PT bank statement sample data"
          >
            <Building2 size={14} aria-hidden="true" />
            <span>Load Bank Sample</span>
          </button>

          <button
            type="button"
            className="sample-data-btn"
            onClick={() => processCsvText(SAMPLE_STRIPE_CSV, 'stripe-sample.csv')}
            disabled={isProcessing}
            title="Load built-in Stripe merchant fee data"
          >
            <CreditCard size={14} aria-hidden="true" />
            <span>Load Stripe Fees</span>
          </button>

          <button
            type="button"
            className="sample-data-btn"
            onClick={() => processCsvText(SAMPLE_EXPENSE_SHEET_CSV, 'Practice Spending Log.csv')}
            disabled={isProcessing}
            title="Load built-in Google Sheets Expense Log sample"
          >
            <FileSpreadsheet size={14} aria-hidden="true" />
            <span>Load Sheets Log</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`import-alert alert-${importStatus.type}`} role="alert">
          <div className="alert-icon-wrap">
            {importStatus.type === 'success' && <CheckCircle2 size={18} aria-hidden="true" />}
            {importStatus.type === 'warning' && <AlertTriangle size={18} aria-hidden="true" />}
            {importStatus.type === 'error' && <FileSpreadsheet size={18} aria-hidden="true" />}
          </div>
          <div className="alert-content">
            <p className="alert-message">{importStatus.message}</p>
            {importStatus.details && importStatus.details.duplicates > 0 && importStatus.details.added > 0 && (
              <p className="alert-duplicate-notice">
                ({importStatus.details.duplicates} duplicate records automatically filtered out)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ExpenseDropzone.displayName = 'ExpenseDropzone';
