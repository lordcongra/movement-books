/**
 * Expense Dropzone & CSV Importer
 * Supports Bank Statement CSVs, Stripe Activity Exports, and instant sample loaders.
 */

import { useState, useRef, useImperativeHandle, forwardRef, type DragEvent, type ChangeEvent } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { parseBankCsv } from '../../utils/bankParser';
import { parseStripeCsv } from '../../utils/stripeParser';
import { formatCurrency } from '../../utils/currencyMath';
import { useExpenseStore } from '../../stores/expenseSlice';



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
      const isItemizedStripe =
        (headerLine.includes('feature_name') || headerLine.includes('feature name')) &&
        (headerLine.includes('suite') || headerLine.includes('billing_status') || headerLine.includes('billing status'));
      const isStripe = headerLine.includes('fee') || headerLine.includes('balance transaction') || isItemizedStripe;

      if (isStripe) {
        const stripeRes = parseStripeCsv(csvText, { filename, defaultYear: selectedYear });

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
