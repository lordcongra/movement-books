/**
 * Expense Categorization Engine & User Label Mappings
 * Pride In Movement Physical Therapy — Financial & Tax Management
 *
 * Provides IRS Schedule C category rules, PT keyword dictionaries,
 * and user category label mappings for Google Sheets and CSV imports.
 */

import type { ExpenseCategory } from '../types/expense';
import { TAX_CATEGORIES } from './taxCategories';

export interface CategoryRule {
  category: ExpenseCategory | 'Personal / Non-Deductible';
  keywords: string[];
}

export const PT_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Personal / Non-Deductible',
    keywords: ['donation', 'make-a-wish', 'charity', 'personal'],
  },
  {
    category: 'Rent / Clinical Space',
    keywords: ['rent', 'sublease', 'clinical space', 'studio lease', 'gym lease', 'facility fee'],
  },
  {
    category: 'Software & Subscriptions',
    keywords: [
      'google', 'workspace', 'zoom', 'embodia', 'quickbooks', 'intuit', 'jane app', 'squarespace',
      'webflow', 'adobe', 'dropbox', 'docusign', 'canva', 'mailchimp', 'software', 'subscription',
      'srfax', 'fax', 'namecheap', 'domain',
    ],
  },
  {
    category: 'Utilities & Phone',
    keywords: ['verizon', 'at&t', 't-mobile', 'sprint', 'comcast', 'spectrum', 'internet', 'wireless', 'phone plan', 'electric', 'utility'],
  },
  {
    category: 'Continuing Education & Training',
    keywords: ['medbridge', 'apta', 'ceu', 'continuing ed', 'education', 'seminar', 'webinar', 'course', 'dry needling course', 'cert dn', 'conference', 'institute'],
  },
  {
    category: 'Office Expense & Supplies',
    keywords: [
      'lhasa', 'seirin', 'optp', 'performance health', 'supplies', 'needles', 'sharps', 'wipes', 'sanitizer',
      'massage cream', 'band', 'stationery', 'amazon', 'target', 'staples', 'walmart',
      'cricut', 'easypress', 'command strips', 'box cutter', 'poster board', 'thumbsaver', 'theraband',
    ],
  },
  {
    category: 'Meals (Tax Deductible)',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'diner', 'bistro', 'panera',
      'lunch', 'dinner', 'breakfast', 'brunch', 'chipotle', 'food', 'meal',
      'networking lunch', 'networking breakfast', 'networking dinner', 'networking meal',
    ],
  },
  {
    category: 'Advertising & Marketing',
    keywords: [
      'adwords', 'google ads', 'facebook ads', 'meta ads', 'marketing', 'flyers', 'vista print', 'print', 'sponsor',
      'business cards', 'rack cards', 'smartpress', 'ninjatransfers', 'gang sheet', 'shirt blanks',
      'website redesign', 'web design', 'networking group dues', 'networking membership', 'bni dues', 'bni membership',
    ],
  },
  {
    category: 'Liability & Malpractice Insurance',
    keywords: ['hpso', 'malpractice', 'liability insurance', 'cna insurance', 'hiscox', 'insurance premium', 'commercial insurance'],
  },
  {
    category: 'Licenses, Certifications & Dues',
    keywords: ['board of pt', 'pt board', 'state board', 'licensing', 'license renewal', 'apta dues', 'dues', 'certification', 'cpr renewal', 'bls', 'red cross'],
  },
  {
    category: 'Bank & Merchant Fees',
    keywords: ['bank fee', 'monthly fee', 'maintenance fee', 'service charge', 'wire fee', 'overdraft', 'analysis fee', 'merchant fee', 'stripe fee'],
  },
  {
    category: 'Professional Services & Legal',
    keywords: ['cpa', 'accountant', 'accounting', 'legal', 'attorney', 'law office', 'bookkeep', 'tax prep', 'llc annual'],
  },
  {
    category: 'Equipment & Furnishings',
    keywords: ['treatment table', 'clinton industries', 'hi-lo', 'dynamometer', 'rogue', 'barbell', 'kettlebell', 'weights', 'exercise machine', 'furnishing'],
  },
  {
    category: 'Travel & Mileage',
    keywords: ['shell', 'chevron', 'exxon', 'mobil', 'bp', 'gas', 'fuel', 'parking', 'toll', 'ezpass', 'hotel', 'airline', 'flight', 'airbnb', 'uber', 'lyft'],
  },
];

/**
 * Assigns an expense category based on matching keywords in vendor and description.
 */
export function categorizeBankTransaction(
  vendor: string,
  description: string
): ExpenseCategory | 'Personal / Non-Deductible' | 'Uncategorized' {
  const combined = `${vendor} ${description}`.toLowerCase();

  for (const rule of PT_CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) {
        return rule.category;
      }
    }
  }

  return 'Uncategorized';
}

/**
 * Maps user-supplied category names (e.g. from Google Sheets exports) to standard tax categories.
 */
export function mapUserCategory(rawCategory?: string | null): ExpenseCategory | 'Personal / Non-Deductible' | null {
  if (!rawCategory) return null;
  const trimmed = rawCategory.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  // Explicit user alias mappings
  if (lower === 'education' || lower.includes('education') || lower === 'ceu' || lower.includes('training')) {
    return 'Continuing Education & Training';
  }
  if (
    lower === 'food costs' ||
    lower === 'food' ||
    lower === 'meals' ||
    lower === 'meal' ||
    lower.includes('food') ||
    lower.includes('meal')
  ) {
    return 'Meals (Tax Deductible)';
  }
  if (
    lower === 'supplies' ||
    lower === 'consumables' ||
    lower.includes('supplies') ||
    lower.includes('consumables')
  ) {
    return 'Office Expense & Supplies';
  }
  if (
    lower === 'marketing' ||
    lower === 'ads' ||
    lower === 'ad' ||
    lower.includes('marketing') ||
    lower.includes('advertising')
  ) {
    return 'Advertising & Marketing';
  }
  if (
    lower === 'personal' ||
    lower === 'donation' ||
    lower === 'charity' ||
    lower.includes('donation') ||
    lower.includes('make-a-wish') ||
    lower.includes('personal')
  ) {
    return 'Personal / Non-Deductible';
  }
  if (lower.includes('software') || lower.includes('subscription')) {
    return 'Software & Subscriptions';
  }
  if (lower.includes('rent') || lower.includes('space') || lower.includes('sublease')) {
    return 'Rent / Clinical Space';
  }
  if (lower.includes('insurance') || lower.includes('malpractice')) {
    return 'Liability & Malpractice Insurance';
  }
  if (lower.includes('license') || lower.includes('dues') || lower.includes('certification')) {
    return 'Licenses, Certifications & Dues';
  }
  if (lower.includes('legal') || lower.includes('cpa') || lower.includes('tax prep')) {
    return 'Professional Services & Legal';
  }
  if (lower.includes('equipment') || lower.includes('furnishing')) {
    return 'Equipment & Furnishings';
  }
  if (lower.includes('travel') || lower.includes('mileage') || lower.includes('fuel')) {
    return 'Travel & Mileage';
  }
  if (lower.includes('bank fee') || lower.includes('merchant fee')) {
    return 'Bank & Merchant Fees';
  }
  if (lower.includes('utility') || lower.includes('phone') || lower.includes('internet')) {
    return 'Utilities & Phone';
  }

  // Canonical TAX_CATEGORIES matching
  const matched = TAX_CATEGORIES.find(
    (c) => c.name.toLowerCase() === lower || c.id.toLowerCase() === lower
  );
  if (matched) {
    return matched.id;
  }

  return null;
}
