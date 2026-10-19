/**
 * Expense and Split Transaction Data Types
 * Pride In Movement Physical Therapy — Financial & Tax Management
 */

export type ExpenseCategory =
  | 'Advertising & Marketing'
  | 'Office Expense & Supplies'
  | 'Rent / Clinical Space'
  | 'Professional Services & Legal'
  | 'Continuing Education & Training'
  | 'Software & Subscriptions'
  | 'Liability & Malpractice Insurance'
  | 'Licenses, Certifications & Dues'
  | 'Travel & Mileage'
  | 'Meals (Tax Deductible)'
  | 'Utilities & Phone'
  | 'Equipment & Furnishings'
  | 'Bank & Merchant Fees'
  | 'Other Business Expense';

export type SplitType = 'business' | 'personal';

export interface SplitSegment {
  id: string;
  type: SplitType;
  amount: number; // Dollars, cents-safe
  percentage: number; // 0 to 100
  category: ExpenseCategory | 'Personal / Non-Deductible';
  notes?: string;
}

export interface ExpenseRecord {
  id: string; // Unique deterministic hash or uuid
  date: string; // ISO YYYY-MM-DD
  vendor: string;
  description: string;
  amount: number; // Total transaction amount
  isSplit: boolean;
  splits: SplitSegment[]; // Sum of splits strictly equals amount
  category: ExpenseCategory | 'Personal / Non-Deductible' | 'Mixed / Split' | 'Uncategorized';
  businessAmount: number; // Sum of business splits or total if 100% business
  personalAmount: number; // Sum of personal splits
  paymentMethod?: string;
  receiptName?: string;
  notes?: string;
  importedAt?: string;
  hash?: string;
}

export interface BankParseResult {
  records: ExpenseRecord[];
  totalParsed: number;
  totalExpenseAmount: number;
  depositsSkipped: number;
  warnings: string[];
  errors: string[];
}

export interface StripeParseResult {
  records: ExpenseRecord[];
  totalParsed: number;
  totalFees: number;
  zeroFeeSkipped: number;
  warnings: string[];
  errors: string[];
}
