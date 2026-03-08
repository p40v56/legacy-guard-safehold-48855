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
  decryptFile,
} from '@/lib/crypto';
import { PLAN_LIMITS, PlanTier } from '@/hooks/usePlan';

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
const ENCRYPTED_FINANCIAL_FIELDS = ['name', 'institution', 'reference_number', 'notes', 'contact_name', 'contact_phone', 'contact_email', 'category_specific_fields_json'];
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
  if (contact.use_type_defaults) {
    const typeDefault = typePermissions.find(
      (tp: any) => tp.contact_type === contact.contact_type
    );
    if (typeDefault?.default_permissions) {
      return typeDefault.default_permissions;
    }
  }
  return contact.permissions || {};
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
  const [profileRes, docsRes, accountsRes, financialsRes, settingsRes, rulesRes, profContactsRes] = await Promise.all([
    supabase.from('profiles').select('first_name, first_name_iv, last_name, last_name_iv, emergency_instructions, emergency_instructions_iv, plan, phone').eq('user_id', userId).single(),
    supabase.from('legacy_documents').select('*').eq('user_id', userId),
    supabase.from('accounts').select('*').eq('user_id', userId),
    supabase.from('financial_assets').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('switch_triggered, switch_triggered_at').eq('user_id', userId).maybeSingle(),
    supabase.from('activation_rules').select('*').eq('user_id', userId).eq('enabled', true),
    supabase.from('contacts').select('*').eq('user_id', userId).in('contact_type', ['professional', 'legal', 'financial']),
  ]);

  const profile = profileRes.data;
  const userPlan = profile?.plan || 'free';
  const tierLimits = PLAN_LIMITS[(userPlan === 'paid' ? 'essential' : userPlan) as PlanTier] || PLAN_LIMITS.free;

  // Decrypt profile names
  const decryptedProfileValues = profile ? await decryptFields(profile, ENCRYPTED_PROFILE_FIELDS, vaultKey) : {};
  const decryptedProfile = { ...profile, ...decryptedProfileValues };

  // Decrypt contact fields
  const decryptedContactValues = await decryptFields(contact, ENCRYPTED_CONTACT_FIELDS, vaultKey);
  const decryptedContact = { ...contact, ...decryptedContactValues };

  // Decrypt ALL documents (before permission filtering, for attached doc lookups)
  const allDocs = await Promise.all(
    (docsRes.data || []).map(async (doc: any) => {
      const decrypted = await decryptFields(doc, ENCRYPTED_DOC_FIELDS, vaultKey);
      return { ...doc, ...decrypted };
    })
  );

  // Filter documents by permissions and plan limits
  let documents: any[] = [];
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
  // Apply plan limit
  if (tierLimits.maxDocuments !== Infinity) {
    documents = documents.slice(0, tierLimits.maxDocuments);
  }

  // Decrypt & filter accounts (limited by plan)
  let accounts: any[] = [];
  if (tierLimits.maxAccounts > 0) {
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
    if (tierLimits.maxAccounts !== Infinity) {
      accounts = accounts.slice(0, tierLimits.maxAccounts);
    }
  }

  // Decrypt & filter financials (limited by plan)
  let financialAssets: any[] = [];
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
  if (tierLimits.maxFinancialAssets !== Infinity) {
    financialAssets = financialAssets.slice(0, tierLimits.maxFinancialAssets);
  }

  // Helper to resolve attached documents from allDocs (with file data)
  const resolveAttachedDocs = async (docIds: string[] | null | undefined) => {
    if (!docIds || docIds.length === 0) return [];
    const found = docIds
      .map((docId: string) => allDocs.find((d: any) => d.id === docId))
      .filter(Boolean);
    return Promise.all(found.map(async (d: any) => {
      const fileBundle = await decryptFileForBundle(d);
      return {
        id: d.id,
        title: d.title,
        file_path: d.file_path || null,
        document_type: d.document_type,
        file_data: fileBundle?.file_data || null,
        file_type: fileBundle?.file_type || d.file_type || null,
      };
    }));
  };

  // Helper to download and decrypt a file from storage, returning base64
  const MAX_FILE_SIZE_FOR_BUNDLE = 5 * 1024 * 1024; // 5MB
  async function decryptFileForBundle(doc: any): Promise<{ file_data: string; file_type: string } | null> {
    if (!doc.file_path || !doc.file_iv) return null;
    try {
      const { data: fileBlob, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);
      if (error || !fileBlob) return null;
      if (fileBlob.size > MAX_FILE_SIZE_FOR_BUNDLE) return null;
      const encryptedBuffer = await fileBlob.arrayBuffer();
      const decryptedBuffer = await decryptFile(encryptedBuffer, doc.file_iv, vaultKey);
      // Convert to base64
      const bytes = new Uint8Array(decryptedBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return { file_data: btoa(binary), file_type: doc.file_type || 'application/octet-stream' };
    } catch (e) {
      console.error('Failed to decrypt file for portal bundle:', e);
      return null;
    }
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

  // Decrypt key professionals
  const keyProfessionals = await Promise.all(
    (profContactsRes.data || []).map(async (c: any) => {
      const dec = await decryptFields(c, ['name', 'phone', 'relationship', 'notes'], vaultKey);
      return {
        name: dec.name || c.name,
        phone: dec.phone || null,
        email: c.email,
        relationship: dec.relationship || c.contact_type,
      };
    })
  );

  // Build clean portal data object (plaintext — all values must be decrypted before here)
  const portalData = {
    contactName: decryptedContact.name || contact.name,
    userName,
    userPlan,
    contactType: contact.contact_type,
    customMessage,
    emergencyInstructions: permissions.emergency_instructions ? decryptedProfile?.emergency_instructions : null,
    switchTriggeredAt: settingsRes.data?.switch_triggered_at || null,
    keyProfessionals,
    documents: await Promise.all(documents.map(async (d) => {
      const fileBundle = await decryptFileForBundle(d);
      return {
        id: d.id, title: d.title, content: d.content, document_type: d.document_type,
        description: d.description, created_at: d.created_at, updated_at: d.updated_at,
        file_path: d.file_path,
        file_data: fileBundle?.file_data || null,
        file_type: fileBundle?.file_type || d.file_type || null,
      };
    })),
    accounts: await Promise.all(accounts.map(async (a) => ({
      id: a.id, account_name: a.account_name, platform: a.platform, username: a.username,
      email: a.email, account_type: a.account_type, importance: a.importance,
      closure_action: a.closure_action, notes: a.notes, website_url: a.website_url,
      credentials: a.credentials || null,
      updated_at: a.updated_at,
      attached_documents: await resolveAttachedDocs(a.attached_document_ids),
    }))),
    financialAssets: await Promise.all(financialAssets.map(async (f) => ({
      id: f.id, name: f.name, category: f.category, institution: f.institution,
      reference_number: f.reference_number, estimated_value: f.estimated_value,
      notes: f.notes, contact_name: f.contact_name, contact_phone: f.contact_phone,
      contact_email: f.contact_email, category_specific_fields: (() => {
        if (f.category_specific_fields_json) {
          try { return JSON.parse(f.category_specific_fields_json as string); } catch { return {}; }
        }
        return (f as any).category_specific_fields || {};
      })(),
      updated_at: f.updated_at,
      attached_documents: await resolveAttachedDocs(f.attached_document_ids),
    }))),
    permissions,
  };

  // Encrypt with share key
  const { ciphertext, iv } = await encryptText(JSON.stringify(portalData), shareKey);

  // Collect shared document IDs for access verification
  const sharedDocumentIds = documents.map((d: any) => d.id);

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
      shared_document_ids: sharedDocumentIds,
    } as any);
}
