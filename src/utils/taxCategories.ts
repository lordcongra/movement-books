/**
 * Standard IRS Schedule C Tax Categories for Physical Therapy Solo Practices
 */

import type { ExpenseCategory } from '../types/expense';

export interface TaxCategoryMeta {
  id: ExpenseCategory;
  name: string;
  scheduleCLine: string;
  description: string;
  typicalExamples: string;
  defaultDeductibleRate: number; // e.g. 1.0 for 100%, 0.5 for 50% meals
}

export const TAX_CATEGORIES: TaxCategoryMeta[] = [
  {
    id: 'Advertising & Marketing',
    name: 'Advertising & Marketing',
    scheduleCLine: 'Line 8 (Advertising)',
    description: 'Promotional expenses, website hosting, Google/social ads, local sponsorships',
    typicalExamples: 'Squarespace/Webflow, Google Ads, business cards, flyers',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Office Expense & Supplies',
    name: 'Office Expense & Supplies',
    scheduleCLine: 'Line 18 (Office expense) / Line 22 (Supplies)',
    description: 'Everyday administrative and treatment consumables',
    typicalExamples: 'Sanitizing wipes, massage cream, resistance bands, paper towels, stationery',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Rent / Clinical Space',
    name: 'Rent / Clinical Space',
    scheduleCLine: 'Line 20b (Rent - other business property)',
    description: 'Physical therapy studio, gym sublease, or treatment room rent',
    typicalExamples: 'Monthly clinic sublease, gym space fee',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Professional Services & Legal',
    name: 'Professional Services & Legal',
    scheduleCLine: 'Line 17 (Legal and professional services)',
    description: 'CPA, tax preparation, bookkeeping, legal counsel',
    typicalExamples: 'Tax accountant, LLC annual registration filing attorney',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Continuing Education & Training',
    name: 'Continuing Education & Training',
    scheduleCLine: 'Line 27a (Other expenses)',
    description: 'Clinical courses, dry needling certifications, PT seminars',
    typicalExamples: 'Cert. DN courses, APTA conferences, MedBridge subscription',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Software & Subscriptions',
    name: 'Software & Subscriptions',
    scheduleCLine: 'Line 27a (Other expenses)',
    description: 'EMR, telehealth, billing, email, productivity software',
    typicalExamples: 'Embodia, Google Workspace, Zoom, QuickBooks/accounting tools',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Liability & Malpractice Insurance',
    name: 'Liability & Malpractice Insurance',
    scheduleCLine: 'Line 15 (Insurance other than health)',
    description: 'Professional liability, general liability, and commercial property insurance',
    typicalExamples: 'HPSO malpractice insurance, general business liability',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Licenses, Certifications & Dues',
    name: 'Licenses, Certifications & Dues',
    scheduleCLine: 'Line 23 (Taxes and licenses) / Line 27a',
    description: 'State physical therapy board licensing and professional association dues',
    typicalExamples: 'State PT license renewal, APTA membership dues, CPR renewal',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Travel & Mileage',
    name: 'Travel & Mileage',
    scheduleCLine: 'Line 9 (Car and truck expenses) / Line 24a (Travel)',
    description: 'Standard business mileage for mobile PT sessions, lodging for conferences',
    typicalExamples: 'Patient home visit mileage (IRS standard rate), conference lodging',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Meals (Tax Deductible)',
    name: 'Meals (Tax Deductible - 50%)',
    scheduleCLine: 'Line 24b (Deductible meals)',
    description: 'Business meals with colleagues or referring providers (50% deduction limit)',
    typicalExamples: 'Referral partner lunches, professional dinner meetings',
    defaultDeductibleRate: 0.5,
  },
  {
    id: 'Utilities & Phone',
    name: 'Utilities & Phone',
    scheduleCLine: 'Line 25 (Utilities)',
    description: 'Practice phone line, internet (split if shared personal/business)',
    typicalExamples: 'Dedicated mobile PT phone plan, clinic internet',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Equipment & Furnishings',
    name: 'Equipment & Furnishings',
    scheduleCLine: 'Line 13 (Depreciation) / Section 179',
    description: 'Treatment tables, clinical modalities, exercise machines',
    typicalExamples: 'Hi-lo treatment table, barbell set, dynamometer',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Bank & Merchant Fees',
    name: 'Bank & Merchant Fees',
    scheduleCLine: 'Line 27a (Other expenses)',
    description: 'Payment processing fees, credit card charges, business bank account fees',
    typicalExamples: 'Stripe credit card processing fees, wire fees',
    defaultDeductibleRate: 1.0,
  },
  {
    id: 'Other Business Expense',
    name: 'Other Business Expense',
    scheduleCLine: 'Line 27a (Other expenses)',
    description: 'Miscellaneous allowable ordinary and necessary business expenses',
    typicalExamples: 'Postage, clinical uniforms / scrubs with logo',
    defaultDeductibleRate: 1.0,
  },
];

export const CATEGORY_NAMES = TAX_CATEGORIES.map((c) => c.name);
