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

async function countRemainingPlaintext(
  table: string,
  userId: string,
  fields: string[]
): Promise<number> {
  const { data, error } = await (supabase.from(table as any).select('*') as any).eq('user_id', userId);
  if (error || !data) return 0;
  return (data as any[]).filter((r) => needsEncryption(r, fields)).length;
}

/**
 * Encrypt all existing plaintext data for a user.
 * Idempotent per row: only touches records that don't yet have _iv values.
 * After the pass, re-counts rows with lingering plaintext so callers can decide
 * whether to persist a `migration_complete` flag.
 */
export async function migrateUserData(
  userId: string,
  vaultKey: CryptoKey
): Promise<MigrationResult & { remainingPlaintext: number; complete: boolean; remainingByTable: Record<string, number> }> {
  const [accounts, contacts, documents, financialAssets, activationRules, profiles] = await Promise.all([
    encryptTable('accounts', userId, ACCOUNT_FIELDS, vaultKey),
    encryptTable('contacts', userId, CONTACT_FIELDS, vaultKey),
    encryptTable('legacy_documents', userId, DOCUMENT_FIELDS, vaultKey),
    encryptTable('financial_assets', userId, FINANCIAL_FIELDS, vaultKey),
    encryptTable('activation_rules', userId, ACTIVATION_RULE_FIELDS, vaultKey),
    encryptProfileTable(userId, PROFILE_FIELDS, vaultKey),
  ]);

  const [rAcc, rCon, rDoc, rFin, rAct, rProf] = await Promise.all([
    countRemainingPlaintext('accounts', userId, ACCOUNT_FIELDS),
    countRemainingPlaintext('contacts', userId, CONTACT_FIELDS),
    countRemainingPlaintext('legacy_documents', userId, DOCUMENT_FIELDS),
    countRemainingPlaintext('financial_assets', userId, FINANCIAL_FIELDS),
    countRemainingPlaintext('activation_rules', userId, ACTIVATION_RULE_FIELDS),
    countRemainingPlaintext('profiles', userId, PROFILE_FIELDS),
  ]);

  const remainingByTable = {
    accounts: rAcc,
    contacts: rCon,
    legacy_documents: rDoc,
    financial_assets: rFin,
    activation_rules: rAct,
    profiles: rProf,
  };
  const remainingPlaintext = rAcc + rCon + rDoc + rFin + rAct + rProf;

  return {
    accounts,
    contacts,
    documents,
    financialAssets,
    activationRules,
    profiles,
    total: accounts + contacts + documents + financialAssets + activationRules + profiles,
    remainingPlaintext,
    complete: remainingPlaintext === 0,
    remainingByTable,
  };
}

