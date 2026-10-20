/**
 * Tax Report Action Toolbar (CSV Export & Print Engine)
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

import React from 'react';
import { Download, Printer, ShieldCheck } from 'lucide-react';

interface TaxToolbarProps {
  onExportCsv: () => void;
  onPrint: () => void;
  year: number;
}

export const TaxToolbar: React.FC<TaxToolbarProps> = ({
  onExportCsv,
  onPrint,
  year,
}) => {
  return (
    <div className="tax-toolbar" role="toolbar" aria-label="Tax report actions">
      <div className="toolbar-info">
        <ShieldCheck size={16} className="text-emerald" aria-hidden="true" />
        <span>CPA-ready statement formatted for {year} IRS Form 1040 Schedule C</span>
      </div>

      <div className="toolbar-actions">
        <button
          type="button"
          className="btn-toolbar btn-print"
          onClick={onPrint}
          aria-label={`Print or Save as PDF for ${year}`}
          title="Opens print dialog formatted for 1-2 page CPA financial statement"
        >
          <Printer size={16} aria-hidden="true" />
          <span>Print / Save as PDF</span>
        </button>

        <button
          type="button"
          className="btn-toolbar btn-export"
          onClick={onExportCsv}
          aria-label={`Export Schedule C CSV for ${year}`}
          title={`Download movement-books-schedule-c-${year}.csv`}
        >
          <Download size={16} aria-hidden="true" />
          <span>Export Schedule C Summary (CSV)</span>
        </button>
      </div>
    </div>
  );
};
