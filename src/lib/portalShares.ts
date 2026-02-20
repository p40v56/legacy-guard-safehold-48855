/**
 * Portal Share Creation
 *
 * When a user generates a portal link for a contact, this module:
 * 1. Fetches & decrypts all user data with the vault key
 * 2. Filters data by contact permissions
 * 3. Re-encrypts the filtered bundle with a key derived from the access token
 * 4. Stores the encrypted bundle in contact_shares (keyed by token hash)
 *
 * The portal page later derives the same key from the URL token to decrypt.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  deriveKeyFromToken,
  encryptText,
  decryptText,
  decryptFields,
} from '@/lib/crypto';

/** Hash the raw token string (not bytes) for DB lookup — must match portal side */
async function hashTokenString(rawToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(rawToken));
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const ENCRYPTED_DOC_FIELDS = ['title', 'description', 'content'];
const ENCRYPTED_ACCOUNT_FIELDS = ['account_name', 'username', 'credentials', 'website_url', 'notes', 'email', 'platform'];
const ENCRYPTED_FINANCIAL_FIELDS = ['name', 'institution', 'reference_number', 'notes', 'contact_name', 'contact_phone', 'contact_email'];
const ENCRYPTED_CONTACT_FIELDS = ['name', 'phone', 'relationship', 'notes', 'custom_message'];
const ENCRYPTED_PROFILE_FIELDS = ['first_name', 'last_name', 'emergency_instructions'];

interface ContactPermissions {
  digital_accounts?: {
    all_accounts?: boolean;
    by_category?: string[];
    specific_accounts?: string[];
  };
  legacy_documents?: {
    all_documents?: boolean;
    by_category?: string[];
    specific_documents?: string[];
  };
  emergency_instructions?: boolean;
}

function resolvePermissions(contact: any, typePermissions: any[]): ContactPermissions {
  let permissions: ContactPermissions = contact.permissions || {};
  if (contact.use_type_defaults) {
    const typeDefault = typePermissions.find(
      (tp: any) => tp.contact_type === contact.contact_type
    );
    if (typeDefault?.default_permissions) {
      permissions = { ...typeDefault.default_permissions, ...permissions };
    }
  }
  return permissions;
}

/**
 * Create encrypted portal shares for a contact after generating a portal token.
 */
export async function createPortalShares(
  userId: string,
  contactId: string,
  tokenHex: string,
  vaultKey: CryptoKey
): Promise<void> {
  // tokenHex is the raw token string — pass directly to deriveKeyFromToken
  const shareKey = await deriveKeyFromToken(tokenHex);
  const tokenHash = await hashTokenString(tokenHex);

  // Fetch contact and permissions
  const [contactRes, typePermRes] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', contactId).single(),
    supabase.from('contact_type_permissions').select('*').eq('user_id', userId),
  ]);

  const contact = contactRes.data;
  if (!contact) return;

  const permissions = resolvePermissions(contact, typePermRes.data || []);

  // Fetch all user data in parallel
  const [profileRes, docsRes, accountsRes, financialsRes, settingsRes, rulesRes] = await Promise.all([
    supabase.from('profiles').select('first_name, first_name_iv, last_name, last_name_iv, emergency_instructions, emergency_instructions_iv, plan').eq('user_id', userId).single(),
    supabase.from('legacy_documents').select('*').eq('user_id', userId),
    supabase.from('accounts').select('*').eq('user_id', userId),
    supabase.from('financial_assets').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('switch_triggered, switch_triggered_at').eq('user_id', userId).maybeSingle(),
    supabase.from('activation_rules').select('*').eq('user_id', userId).eq('enabled', true),
  ]);

  const profile = profileRes.data;
  const userPlan = profile?.plan || 'free';
  const isFree = userPlan === 'free';

  // Decrypt profile names
  const decryptedProfileValues = profile ? await decryptFields(profile, ENCRYPTED_PROFILE_FIELDS, vaultKey) : {};
  const decryptedProfile = { ...profile, ...decryptedProfileValues };

  // Decrypt contact fields
  const decryptedContactValues = await decryptFields(contact, ENCRYPTED_CONTACT_FIELDS, vaultKey);
  const decryptedContact = { ...contact, ...decryptedContactValues };

  // Decrypt & filter documents
  let documents: any[] = [];
  if (!isFree) {
    const allDocs = await Promise.all(
      (docsRes.data || []).map(async (doc: any) => {
        const decrypted = await decryptFields(doc, ENCRYPTED_DOC_FIELDS, vaultKey);
        return { ...doc, ...decrypted };
      })
    );
    const docPerms = permissions.legacy_documents;
    if (docPerms) {
      if (docPerms.all_documents) {
        documents = allDocs;
      } else {
        const cats = docPerms.by_category || [];
        const ids = docPerms.specific_documents || [];
        if (cats.length > 0 || ids.length > 0) {
          documents = allDocs.filter(
            (d: any) => cats.includes(d.document_type) || ids.includes(d.id)
          );
        }
      }
    }
  }

  // Decrypt & filter accounts
  let accounts: any[] = [];
  if (!isFree) {
    const allAccounts = await Promise.all(
      (accountsRes.data || []).map(async (acct: any) => {
        const decrypted = await decryptFields(acct, ENCRYPTED_ACCOUNT_FIELDS, vaultKey);
        return { ...acct, ...decrypted };
      })
    );
    const acctPerms = permissions.digital_accounts;
    if (acctPerms) {
      if (acctPerms.all_accounts) {
        accounts = allAccounts;
      } else {
        const cats = acctPerms.by_category || [];
        const ids = acctPerms.specific_accounts || [];
        if (cats.length > 0 || ids.length > 0) {
          accounts = allAccounts.filter(
            (a: any) => cats.includes(a.account_type) || ids.includes(a.id)
          );
        }
      }
    }
  }

  // Decrypt & filter financials
  let financialAssets: any[] = [];
  if (!isFree) {
    const allFinancials = await Promise.all(
      (financialsRes.data || []).map(async (asset: any) => {
        const decrypted = await decryptFields(asset, ENCRYPTED_FINANCIAL_FIELDS, vaultKey);
        return { ...asset, ...decrypted };
      })
    );
    financialAssets = allFinancials.filter((a: any) => {
      if (!a.visible_to || a.visible_to.length === 0) return true;
      return a.visible_to.includes(contactId);
    });
  }

  // Custom message resolution
  let customMessage = decryptedContact.custom_message || null;
  if (!customMessage && rulesRes.data) {
    for (const rule of rulesRes.data) {
      let ruleMessage = rule.custom_message;
      if (ruleMessage && rule.custom_message_iv) {
        try {
          ruleMessage = await decryptText(rule.custom_message, rule.custom_message_iv, vaultKey);
        } catch { /* use raw */ }
      }
      if (!ruleMessage) continue;

      if (rule.target_type === 'contacts' && rule.contact_ids?.includes(contact.id)) {
        customMessage = ruleMessage;
        break;
      }
      if (rule.target_type === 'category' && rule.contact_category === contact.contact_type) {
        customMessage = ruleMessage;
        break;
      }
    }
  }

  const userName = `${decryptedProfile?.first_name || ''} ${decryptedProfile?.last_name || ''}`.trim() || 'User';

  // Build clean portal data object (plaintext — all values must be decrypted before here)
  const portalData = {
    contactName: decryptedContact.name || contact.name,
    userName,
    userPlan,
    customMessage,
    emergencyInstructions: permissions.emergency_instructions ? decryptedProfile?.emergency_instructions : null,
    switchTriggeredAt: settingsRes.data?.switch_triggered_at || null,
    documents: documents.map((d) => ({
      id: d.id, title: d.title, content: d.content, document_type: d.document_type,
      description: d.description, created_at: d.created_at, file_path: d.file_path,
    })),
    accounts: accounts.map((a) => ({
      id: a.id, account_name: a.account_name, platform: a.platform, username: a.username,
      email: a.email, account_type: a.account_type, importance: a.importance,
      closure_action: a.closure_action, notes: a.notes, website_url: a.website_url,
    })),
    financialAssets: financialAssets.map((f) => ({
      id: f.id, name: f.name, category: f.category, institution: f.institution,
      reference_number: f.reference_number, estimated_value: f.estimated_value,
      notes: f.notes, contact_name: f.contact_name, contact_phone: f.contact_phone,
      contact_email: f.contact_email,
    })),
    permissions,
  };

  // Encrypt with share key
  const { ciphertext, iv } = await encryptText(JSON.stringify(portalData), shareKey);

  // Replace existing shares for this contact
  await supabase
    .from('contact_shares')
    .delete()
    .eq('contact_id', contactId)
    .eq('user_id', userId);

  await supabase
    .from('contact_shares')
    .insert({
      contact_id: contactId,
      user_id: userId,
      encrypted_content: ciphertext,
      content_iv: iv,
      access_token_hash: tokenHash,
    });
}
