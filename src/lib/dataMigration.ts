/**
 * One-time migration utility to encrypt existing plaintext data
 * in the database for users who had data before E2E encryption was added.
 *
 * Run once per user after they first unlock their vault.
 * Safe to re-run: fields that already have an _iv value are skipped.
 */

import { supabase } from '@/integrations/supabase/client';
import { encryptFields } from '@/lib/crypto';

const ACCOUNT_FIELDS = ['account_name', 'username', 'credentials', 'website_url', 'notes', 'email', 'platform'];
const CONTACT_FIELDS = ['name', 'phone', 'relationship', 'notes', 'custom_message'];
const DOCUMENT_FIELDS = ['title', 'description', 'content'];
const FINANCIAL_FIELDS = ['name', 'institution', 'reference_number', 'notes', 'contact_name', 'contact_phone', 'contact_email'];
const ACTIVATION_RULE_FIELDS = ['custom_message'];
const PROFILE_FIELDS = ['first_name', 'last_name', 'emergency_instructions'];

function needsEncryption(record: any, fields: string[]): boolean {
  // A record needs encryption if at least one field has a value but NO corresponding _iv
  return fields.some(
    (f) => record[f] && !record[`${f}_iv`]
  );
}

async function encryptTable(
  table: string,
  userId: string,
  fields: string[],
  vaultKey: CryptoKey
): Promise<number> {
  const { data: records, error } = await (supabase
    .from(table as any)
    .select('*') as any)
    .eq('user_id', userId);

  if (error || !records) return 0;

  let migrated = 0;

  for (const record of records) {
    if (!needsEncryption(record, fields)) continue;

    const plainValues: Record<string, string | null | undefined> = {};
    for (const field of fields) {
      if (record[field] && !record[`${field}_iv`]) {
        plainValues[field] = record[field];
      }
    }

    if (Object.keys(plainValues).length === 0) continue;

    const encrypted = await encryptFields(plainValues, vaultKey);

    const { error: updateError } = await (supabase
      .from(table as any)
      .update(encrypted) as any)
      .eq('id', record.id);

    if (!updateError) migrated++;
  }

  return migrated;
}

export interface MigrationResult {
  accounts: number;
  contacts: number;
  documents: number;
  financialAssets: number;
  activationRules: number;
  profiles: number;
  total: number;
}

async function encryptProfileTable(
  userId: string,
  fields: string[],
  vaultKey: CryptoKey
): Promise<number> {
  const { data: records, error } = await (supabase
    .from('profiles' as any)
    .select('*') as any)
    .eq('user_id', userId);

  if (error || !records) return 0;

  let migrated = 0;
  for (const record of records) {
    if (!needsEncryption(record, fields)) continue;

    const plainValues: Record<string, string | null | undefined> = {};
    for (const field of fields) {
      if (record[field] && !record[`${field}_iv`]) {
        plainValues[field] = record[field];
      }
    }

    if (Object.keys(plainValues).length === 0) continue;

    const encrypted = await encryptFields(plainValues, vaultKey);

    const { error: updateError } = await (supabase
      .from('profiles' as any)
      .update(encrypted) as any)
      .eq('user_id', record.user_id);

    if (!updateError) migrated++;
  }

  return migrated;
}

/**
 * Encrypt all existing plaintext data for a user.
 * Only touches records that don't yet have _iv values.
 */
export async function migrateUserData(
  userId: string,
  vaultKey: CryptoKey
): Promise<MigrationResult> {
  const [accounts, contacts, documents, financialAssets, activationRules, profiles] = await Promise.all([
    encryptTable('accounts', userId, ACCOUNT_FIELDS, vaultKey),
    encryptTable('contacts', userId, CONTACT_FIELDS, vaultKey),
    encryptTable('legacy_documents', userId, DOCUMENT_FIELDS, vaultKey),
    encryptTable('financial_assets', userId, FINANCIAL_FIELDS, vaultKey),
    encryptTable('activation_rules', userId, ACTIVATION_RULE_FIELDS, vaultKey),
    encryptProfileTable(userId, PROFILE_FIELDS, vaultKey),
  ]);

  return {
    accounts,
    contacts,
    documents,
    financialAssets,
    activationRules,
    profiles,
    total: accounts + contacts + documents + financialAssets + activationRules + profiles,
  };
}
