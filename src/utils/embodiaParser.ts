/**
 * Embodia Billing CSV Parser
 * Pride In Movement Physical Therapy — Financial & Tax Management
 *
 * Implements client-side, privacy-preserving cash-basis revenue extraction,
 * visit categorization, payment method isolation, and duplicate fingerprinting.
 */

import Papa from 'papaparse';
import type {
  EmbodiaInvoiceRecord,
  EmbodiaParseResult,
  EmbodiaRawRow,
  PaymentMethod,
  VisitCategory,
} from '../types/income';
import { roundCurrency } from './currencyMath';
import { normalizeDate } from './dateUtils';
import { generateEmbodiaFingerprint } from './fingerprint';

/**
 * Safely parses a string or number into a 2-decimal rounded dollar float.
 */
function parseSafeAmount(val: unknown): number {
  if (typeof val === 'number') {
    return roundCurrency(val);
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : roundCurrency(num);
  }
  return 0;
}

/**
 * Categorizes a physical therapy visit based on the Embodia invoice Description.
 */
export function categorizeVisit(description?: string | null): VisitCategory {
  if (!description) return 'Other';
  const descLower = description.toLowerCase();

  // Cancellations take priority if flagged in description
  if (
    descLower.includes('cancellation') ||
    descLower.includes('late cancel') ||
    descLower.includes('short notice') ||
    descLower.includes('no show')
  ) {
    return 'Cancellation';
  }

  // Dry needling specific session
  if (descLower.includes('dry needling') || descLower.includes('needling')) {
    return 'Dry Needling';
  }

  // Initial Evaluation
  if (
    descLower.includes('evaluation') ||
    descLower.includes('eval') ||
    descLower.includes('initial')
  ) {
    return 'Evaluation';
  }

  // Follow-up treatments
  if (
    descLower.includes('follow-up') ||
    descLower.includes('follow up') ||
    descLower.includes('followup') ||
    descLower.includes('office visit') ||
    descLower.includes('treatment')
  ) {
    return 'Follow-Up';
  }

  return 'Other';
}

/**
 * Isolates the normalized payment method from Embodia's payment method string.
 */
export function normalizePaymentMethod(rawMethod?: string | null): PaymentMethod {
  if (!rawMethod) return 'Other';
  const m = rawMethod.toLowerCase().trim();

  if (m.includes('stripe')) {
    return 'Stripe';
  }
  if (m.includes('check') || m.includes('cheque')) {
    return 'Check';
  }
  if (m.includes('cash')) {
    return 'Cash';
  }
  return 'Other';
}

const MONTH_NAMES_PATTERN =
  'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const UNQUOTED_DATE_REGEX = new RegExp(
  `(^|,)\\s*(${MONTH_NAMES_PATTERN})\\s+(\\d{1,2}),\\s+(\\d{4})\\s*(?=,|$|\\r|\\n)`,
  'gim'
);

/**
 * Sanitizes CSV content by wrapping unquoted "Month DD, YYYY" dates in double quotes.
 * This prevents naive CSV parsers from splitting the date on its inner comma.
 */
export function sanitizeEmbodiaCsv(csvContent: string): string {
  return csvContent.replace(UNQUOTED_DATE_REGEX, '$1"$2 $3, $4"');
}

/**
 * Parses raw Embodia CSV string and returns structured records with cash-basis analysis.
 */
export function parseEmbodiaCsv(csvContent: string): EmbodiaParseResult {
  const sanitized = sanitizeEmbodiaCsv(csvContent);
  const parsed = Papa.parse<EmbodiaRawRow>(sanitized, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const records: EmbodiaInvoiceRecord[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const categoryBreakdown: Record<VisitCategory, { count: number; revenue: number }> = {
    Evaluation: { count: 0, revenue: 0 },
    'Follow-Up': { count: 0, revenue: 0 },
    'Dry Needling': { count: 0, revenue: 0 },
    Cancellation: { count: 0, revenue: 0 },
    Other: { count: 0, revenue: 0 },
  };

  const paymentMethodBreakdown: Record<PaymentMethod, { count: number; revenue: number }> = {
    Stripe: { count: 0, revenue: 0 },
    Check: { count: 0, revenue: 0 },
    Cash: { count: 0, revenue: 0 },
    Other: { count: 0, revenue: 0 },
  };

  let totalCashRevenue = 0;
  let totalInvoiced = 0;
  let skippedCount = 0;
  const nowIso = new Date().toISOString();

  parsed.data.forEach((row, index) => {
    // Check if the row has any content
    const rawInvoiceDate = row['Invoice date']?.trim() || '';
    const rawPaidAt = row['Paid at']?.trim() || '';
    const rawDesc = row['Description']?.trim() || '';
    const rawStatus = row['Status']?.trim() || '';

    if (!rawInvoiceDate && !rawPaidAt && !rawDesc) {
      skippedCount++;
      return;
    }

    const subtotal = parseSafeAmount(row['Subtotal']);
    const taxes = parseSafeAmount(row['Taxes']);
    const total = parseSafeAmount(row['Total']);
    const subtotalPaid = parseSafeAmount(row['Subtotal paid']);
    const taxesPaid = parseSafeAmount(row['Taxes paid']);
    const totalPaid = parseSafeAmount(row['Total paid']);

    const invoiceDate = normalizeDate(rawInvoiceDate);
    const paidAt = normalizeDate(rawPaidAt);
    const paymentMethod = normalizePaymentMethod(row['Payment method']);
    const rawPaymentMethod = row['Payment method']?.trim() || '';
    const visitCategory = categorizeVisit(rawDesc);

    // Cash-basis revenue criteria:
    // Recognized if Paid at is present, totalPaid > 0, and Status indicates paid in full or settled
    const isPaidInFull = rawStatus.toLowerCase().includes('paid in full');
    const isCashBasisRevenue = Boolean(paidAt && totalPaid > 0 && isPaidInFull);

    const fingerprint = generateEmbodiaFingerprint({
      invoiceDate: rawInvoiceDate,
      invoiceNumber: row['Invoice #'],
      patient: row['Patient'],
      description: rawDesc,
      totalPaid,
      paidAt: rawPaidAt,
      total,
    });

    const record: EmbodiaInvoiceRecord = {
      id: fingerprint,
      invoiceDate,
      rawInvoiceDate,
      invoiceNumber: row['Invoice #']?.trim() || '',
      patient: row['Patient']?.trim() || '',
      email: row['Email']?.trim() || '',
      practitioner: row['Practitioner']?.trim() || '',
      description: rawDesc,
      visitCategory,
      currency: row['Currency']?.trim() || 'USD',
      subtotal,
      taxes,
      total,
      subtotalPaid,
      taxesPaid,
      totalPaid,
      paidAt,
      rawPaidAt,
      paymentMethod,
      rawPaymentMethod,
      status: rawStatus,
      isCashBasisRevenue,
      importedAt: nowIso,
    };

    records.push(record);
    totalInvoiced = roundCurrency(totalInvoiced + total);

    if (isCashBasisRevenue) {
      totalCashRevenue = roundCurrency(totalCashRevenue + totalPaid);
      categoryBreakdown[visitCategory].count += 1;
      categoryBreakdown[visitCategory].revenue = roundCurrency(
        categoryBreakdown[visitCategory].revenue + totalPaid
      );

      paymentMethodBreakdown[paymentMethod].count += 1;
      paymentMethodBreakdown[paymentMethod].revenue = roundCurrency(
        paymentMethodBreakdown[paymentMethod].revenue + totalPaid
      );
    } else {
      warnings.push(
        `Row ${index + 2}: "${rawDesc || 'Visit'}" was not recognized as cash-basis revenue (Status: "${rawStatus}", Total paid: $${totalPaid}).`
      );
    }
  });

  return {
    records,
    totalParsed: records.length,
    cashBasisRevenueCount: records.filter((r) => r.isCashBasisRevenue).length,
    totalCashRevenue,
    totalInvoiced,
    skippedCount,
    categoryBreakdown,
    paymentMethodBreakdown,
    warnings,
    errors,
  };
}
