export type FinancialCategory = 
  | 'bank_account' 
  | 'insurance' 
  | 'investment' 
  | 'pension' 
  | 'property' 
  | 'debt' 
  | 'other';

export interface FinancialAsset {
  id: string;
  user_id: string;
  category: FinancialCategory;
  name: string;
  institution: string | null;
  estimated_value: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  reference_number: string | null;
  notes: string | null;
  category_specific_fields: Record<string, any>;
  visible_to: string[] | null;
  attached_document_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export type FinancialAssetInsert = Omit<FinancialAsset, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const CATEGORY_LABELS: Record<FinancialCategory, string> = {
  bank_account: 'Bank Accounts',
  insurance: 'Insurance Policies',
  investment: 'Investments',
  pension: 'Pensions & Retirement',
  property: 'Properties',
  debt: 'Debts & Liabilities',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<FinancialCategory, string> = {
  bank_account: 'Landmark',
  insurance: 'Shield',
  investment: 'TrendingUp',
  pension: 'Wallet',
  property: 'Home',
  debt: 'CreditCard',
  other: 'Package',
};
