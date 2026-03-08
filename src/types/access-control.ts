
export type ContactType = 'immediate_family' | 'extended_family' | 'close_friends' | 'professional' | 'legal' | 'financial';

export type DigitalAccountCategory = 'social' | 'email' | 'cloud' | 'subscription' | 'other';

export type DocumentCategory = 'legal' | 'financial' | 'medical' | 'personal' | 'insurance' | 'property' | 'other';

export type FinancialAssetAccessCategory = 'bank_account' | 'insurance' | 'investment' | 'pension' | 'property' | 'debt' | 'other';

export interface DigitalAccountAccess {
  all_accounts: boolean;
  by_category: DigitalAccountCategory[];
  specific_accounts: string[]; // Account IDs
}

export interface DocumentAccess {
  all_documents: boolean;
  by_category: DocumentCategory[];
  specific_documents: string[]; // Document IDs
}

export interface FinancialAssetAccess {
  all_assets: boolean;
  by_category: FinancialAssetAccessCategory[];
  specific_assets: string[]; // Asset IDs
}

export interface ContactPermissions {
  digital_accounts: DigitalAccountAccess;
  legacy_documents: DocumentAccess;
  financial_assets: FinancialAssetAccess;
  contact_information: boolean;
  emergency_instructions: boolean;
  can_modify_information: boolean;
}

export interface ContactTypePermissions {
  contact_type: ContactType;
  default_permissions: ContactPermissions;
}

export interface EmergencyContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  contact_type: ContactType;
  priority_order: number;
  can_receive_messages: boolean;
  permissions: ContactPermissions;
  use_type_defaults: boolean;
  custom_message?: string | null;
  created_at: string;
}
