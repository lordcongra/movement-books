/**
 * Income and Embodia Invoice Data Types
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

export type PaymentMethod = 'Stripe' | 'Check' | 'Cash' | 'Other';

export type VisitCategory =
  | 'Evaluation'
  | 'Follow-Up'
  | 'Dry Needling'
  | 'Cancellation'
  | 'Other';

export interface EmbodiaRawRow {
  'Invoice date'?: string;
  'Invoice #'?: string;
  'Patient'?: string;
  'Email'?: string;
  'Username'?: string;
  'Practitioner'?: string;
  'Description'?: string;
  'Currency'?: string;
  'Subtotal'?: string | number;
  'Taxes'?: string | number;
  'Total'?: string | number;
  'Subtotal paid'?: string | number;
  'Taxes paid'?: string | number;
  'Total paid'?: string | number;
  'Subtotal paid from package'?: string | number;
  'Taxes paid from package'?: string | number;
  'Total paid from package'?: string | number;
  'Paid at'?: string;
  'Payment method'?: string;
  'Status'?: string;
  [key: string]: unknown;
}

export interface EmbodiaInvoiceRecord {
  id: string; // Unique deterministic fingerprint
  invoiceDate: string; // ISO YYYY-MM-DD
  rawInvoiceDate: string;
  invoiceNumber: string;
  patient: string;
  email: string;
  practitioner: string;
  description: string;
  visitCategory: VisitCategory;
  currency: string;
  subtotal: number;
  taxes: number;
  total: number;
  subtotalPaid: number;
  taxesPaid: number;
  totalPaid: number;
  paidAt: string; // ISO YYYY-MM-DD or empty
  rawPaidAt: string;
  paymentMethod: PaymentMethod;
  rawPaymentMethod: string;
  status: string;
  isCashBasisRevenue: boolean;
  importedAt: string; // ISO timestamp
}

export interface EmbodiaParseResult {
  records: EmbodiaInvoiceRecord[];
  totalParsed: number;
  cashBasisRevenueCount: number;
  totalCashRevenue: number;
  totalInvoiced: number;
  skippedCount: number;
  categoryBreakdown: Record<VisitCategory, { count: number; revenue: number }>;
  paymentMethodBreakdown: Record<PaymentMethod, { count: number; revenue: number }>;
  warnings: string[];
  errors: string[];
}
