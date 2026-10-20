/**
 * Embodia CSV Drag-and-Drop Upload Card
 * Supports native file drop, file input, sample data loading, and instant feedback.
 */

import React, { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { parseEmbodiaCsv } from '../../utils/embodiaParser';
import { formatCurrency } from '../../utils/currencyMath';
import { useIncomeStore } from '../../stores/incomeSlice';



interface ImportStatus {
  type: 'success' | 'warning' | 'error';
  message: string;
  details?: {
    added: number;
    duplicates: number;
    revenue: number;
  };
}

export const EmbodiaDropzone: React.FC = () => {
  const addRecords = useIncomeStore((state) => state.addRecords);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const processCsvText = (csvText: string, filename: string) => {
    setIsProcessing(true);
    setImportStatus(null);

    try {
      const result = parseEmbodiaCsv(csvText);

      if (result.records.length === 0) {
        setImportStatus({
          type: 'error',
          message: `No valid records found in "${filename}". Please check that this is an Embodia invoice export.`,
        });
        setIsProcessing(false);
        return;
      }

      const { added, duplicates } = addRecords(result.records);

      if (added === 0 && duplicates > 0) {
        setImportStatus({
          type: 'warning',
          message: `All ${duplicates} records in "${filename}" were already imported. No duplicates were added.`,
          details: { added: 0, duplicates, revenue: 0 },
        });
      } else {
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${added} record${added === 1 ? '' : 's'} (${formatCurrency(result.totalCashRevenue)} cash revenue).`,
          details: { added, duplicates, revenue: result.totalCashRevenue },
        });
      }
    } catch (err) {
      console.error('Error processing CSV:', err);
      setImportStatus({
        type: 'error',
        message: `Failed to process file "${filename}": ${err instanceof Error ? err.message : 'Unknown parse error'}`,
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
      const file = files[0];
      readAndProcessFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      readAndProcessFile(files[0]);
    }
    // Reset file input so user can re-upload if needed
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
        aria-label="Upload Embodia billing CSV"
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
            <strong>Click to upload</strong> or drag and drop Embodia billing CSV
          </p>
          <p className="dropzone-sub-text">
            Client-side parsing only. Revenue is calculated on a cash basis (Paid at date &gt; 0).
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
};
