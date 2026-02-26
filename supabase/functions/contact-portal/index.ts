// Redeployed: force Lovable to push latest version to Supabase Edge Functions
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Set APP_BASE_URL in Supabase Edge Function secrets for production.
const ALLOWED_ORIGINS = [
  Deno.env.get("APP_BASE_URL") || "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// ── Crypto helpers ──────────────────────────────────────────

async function hashTokenForStorage(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const arr = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

// Must match client-side hashTokenString in portalShares.ts
const hashTokenString = hashTokenForStorage;

async function hashAnswer(answer: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(answer.trim().toLowerCase())
  );
  const arr = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

// ── Permission helpers ───────────────────────────────────────

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
  contact_information?: boolean;
  emergency_instructions?: boolean;
  can_modify_information?: boolean;
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

function filterDocumentsByPermissions(documents: any[], permissions: ContactPermissions): any[] {
  const docPerms = permissions.legacy_documents;
  if (!docPerms) return [];
  if (docPerms.all_documents) return documents;
  const allowedCategories = docPerms.by_category || [];
  const specificIds = docPerms.specific_documents || [];
  if (allowedCategories.length === 0 && specificIds.length === 0) return [];
  return documents.filter(
    (doc: any) => allowedCategories.includes(doc.document_type) || specificIds.includes(doc.id)
  );
}

function filterAccountsByPermissions(accounts: any[], permissions: ContactPermissions): any[] {
  const acctPerms = permissions.digital_accounts;
  if (!acctPerms) return [];
  if (acctPerms.all_accounts) return accounts;
  const allowedCategories = acctPerms.by_category || [];
  const specificIds = acctPerms.specific_accounts || [];
  if (allowedCategories.length === 0 && specificIds.length === 0) return [];
  return accounts.filter(
    (acct: any) => allowedCategories.includes(acct.account_type) || specificIds.includes(acct.id)
  );
}

function filterFinancialAssets(assets: any[], contactId: string): any[] {
  return assets.filter((a: any) => {
    if (!a.visible_to || a.visible_to.length === 0) return true;
    return a.visible_to.includes(contactId);
  });
}

// ── Token lookup with migration path ─────────────────────────
// Existing tokens were stored as raw hex. New tokens are stored as SHA-256 hashes.
// This function first tries hash lookup, then falls back to raw lookup and migrates.

async function lookupToken(
  supabase: any,
  rawToken: string
): Promise<{ data: any; error: any }> {
  const tokenHash = await hashTokenForStorage(rawToken);

  // Try hash lookup first
  const { data, error } = await supabase
    .from("contact_access_tokens")
    .select("*")
    .eq("token", tokenHash)
    .eq("is_active", true)
    .single();

  if (data) return { data, error: null };

  // Fallback: raw token lookup (migration path for pre-hash tokens)
  const { data: legacyData, error: legacyError } = await supabase
    .from("contact_access_tokens")
    .select("*")
    .eq("token", rawToken)
    .eq("is_active", true)
    .single();

  if (legacyData) {
    // Migrate: replace raw token with hash
    await supabase
      .from("contact_access_tokens")
      .update({ token: tokenHash })
      .eq("id", legacyData.id);
    console.log(`Migrated token ${rawToken.substring(0, 8)}... to hash storage`);
    return { data: legacyData, error: null };
  }

  return { data: null, error: legacyError || error };
}

// ── Rate limiting helper ─────────────────────────────────────

async function checkRateLimit(
  supabase: any,
  tokenHash: string,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("portal_access_attempts")
    .select("*", { count: "exact", head: true })
    .eq("token_hash", tokenHash)
    .eq("success", false)
    .gte("attempted_at", cutoff);

  if ((count || 0) >= 5) {
    return new Response(
      JSON.stringify({
        error: "Too many failed attempts. Please wait 15 minutes before trying again.",
      }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  return null;
}

// ── Encrypted shares ─────────────────────────────────────────

async function servePortalResponse(
  supabase: any,
  tokenData: any,
  contact: any,
  rawToken: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Try encrypted shares first
  try {
    const tokenHash = await hashTokenString(rawToken);
    const { data: share } = await supabase
      .from("contact_shares")
      .select("encrypted_content, content_iv")
      .eq("access_token_hash", tokenHash)
      .eq("contact_id", tokenData.contact_id)
      .single();

    if (share?.encrypted_content && share?.content_iv) {
      console.log(`Serving encrypted portal data for contact`);
      return new Response(
        JSON.stringify({
          encrypted: true,
          encryptedContent: share.encrypted_content,
          contentIv: share.content_iv,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch {
    // No encrypted shares, fall through
  }

  // Check if user has encryption enabled
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("salt")
    .eq("user_id", tokenData.user_id)
    .single();

  if (ownerProfile?.salt) {
    console.error(
      `No portal shares found for contact ${contact.id}, but user has encryption enabled. Portal link must be regenerated.`
    );
    return new Response(
      JSON.stringify({
        error:
          "This portal link needs to be regenerated by the vault owner. Please contact them.",
      }),
      { status: 410, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Legacy fallback: only for pre-encryption users
  return await servePortalDataLegacy(supabase, tokenData, contact, corsHeaders);
}

// ── Legacy portal data (unencrypted fallback) ────────────────

async function servePortalDataLegacy(
  supabase: any,
  tokenData: any,
  contact: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const userId = tokenData.user_id;
  const contactId = tokenData.contact_id;

  const [profileRes, typePermissionsRes, allDocumentsRes, activationRulesRes, accountsRes, financialAssetsRes, settingsRes] =
    await Promise.all([
      supabase.from("profiles").select("first_name, last_name, emergency_instructions, plan").eq("user_id", userId).single(),
      supabase.from("contact_type_permissions").select("*").eq("user_id", userId),
      supabase.from("legacy_documents").select("id, title, content, document_type, description, created_at, file_path").eq("user_id", userId),
      supabase.from("activation_rules").select("*").eq("user_id", userId).eq("enabled", true),
      supabase.from("accounts").select("*").eq("user_id", userId),
      supabase.from("financial_assets").select("*").eq("user_id", userId),
      supabase.from("user_settings").select("switch_triggered, switch_triggered_at").eq("user_id", userId).maybeSingle(),
    ]);

  const profile = profileRes.data;
  const typePermissions = typePermissionsRes.data || [];
  const allDocuments = allDocumentsRes.data || [];
  const activationRules = activationRulesRes.data || [];
  const allAccounts = accountsRes.data || [];
  const allFinancialAssets = financialAssetsRes.data || [];
  const settings = settingsRes.data;

  const permissions = resolvePermissions(contact, typePermissions);
  const userPlan = profile?.plan || "free";
  const isFree = userPlan === "free";

  const allowedDocuments = isFree ? [] : filterDocumentsByPermissions(allDocuments, permissions);
  const allowedAccounts = isFree ? [] : filterAccountsByPermissions(allAccounts, permissions);
  const allowedFinancialAssets = isFree ? [] : filterFinancialAssets(allFinancialAssets, contactId);

  let customMessage = contact.custom_message || null;
  if (!customMessage && activationRules) {
    for (const rule of activationRules) {
      if (rule.target_type === "contacts" && rule.contact_ids?.includes(contact.id)) {
        customMessage = rule.custom_message;
        break;
      }
      if (rule.target_type === "category" && rule.contact_category === contact.contact_type) {
        customMessage = rule.custom_message;
        break;
      }
    }
  }

  const contactDisplayName = contact.email || "Trusted Contact";
  const userDisplayName = "the vault owner";

  console.log(
    `Portal data served (legacy): docs=${allowedDocuments.length}, accounts=${allowedAccounts.length}, financials=${allowedFinancialAssets.length}`
  );

  return new Response(
    JSON.stringify({
      contactName: contactDisplayName,
      userName: userDisplayName,
      userPlan,
      customMessage,
      emergencyInstructions: permissions.emergency_instructions ? profile?.emergency_instructions : null,
      switchTriggeredAt: settings?.switch_triggered_at || null,
      documents: allowedDocuments,
      accounts: allowedAccounts,
      financialAssets: allowedFinancialAssets,
      permissions,
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

// ── Main handler ─────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const token = url.searchParams.get("token");

    // ── verify-answer ──────────────────────────────────────
    if (action === "verify-answer" && req.method === "POST") {
      const body = await req.json();
      const { token: bodyToken, answer } = body;

      if (!bodyToken || !answer) {
        return new Response(
          JSON.stringify({ error: "Missing token or answer" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: tokenData, error: tokenError } = await lookupToken(supabase, bodyToken);

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired access link" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "This access link has expired" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Rate limiting
      const tokenHashForLimit = await hashTokenForStorage(bodyToken);

      // Clean up old attempts (TTL: 24 hours)
      await supabase
        .from("portal_access_attempts")
        .delete()
        .lt("attempted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const rateLimitResponse = await checkRateLimit(supabase, tokenHashForLimit, corsHeaders);
      if (rateLimitResponse) return rateLimitResponse;

      const { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", tokenData.contact_id)
        .single();

      if (!contact) {
        return new Response(
          JSON.stringify({ error: "Contact not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: questions } = await supabase
        .from("security_questions")
        .select("*")
        .eq("user_id", tokenData.user_id);

      const applicableQuestion = findApplicableQuestion(questions || [], contact);

      if (!applicableQuestion) {
        return new Response(
          JSON.stringify({ error: "No security question configured" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Compare hashes — supports both legacy plaintext and new SHA-256 hashes
      const submittedHash = await hashAnswer(answer);
      const storedAnswer = applicableQuestion.answer_hash;
      const isLegacyPlaintext = storedAnswer.length !== 44; // SHA-256 base64 is always 44 chars

      let isCorrect = false;
      if (isLegacyPlaintext) {
        // Legacy plaintext comparison
        isCorrect = answer.trim().toLowerCase() === storedAnswer.trim().toLowerCase();
      } else {
        isCorrect = submittedHash === storedAnswer;
      }

      if (!isCorrect) {
        // Record failed attempt
        await supabase
          .from("portal_access_attempts")
          .insert({ token_hash: tokenHashForLimit, success: false });

        return new Response(
          JSON.stringify({ error: "Incorrect answer. Please try again." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Record successful attempt
      await supabase
        .from("portal_access_attempts")
        .insert({ token_hash: tokenHashForLimit, success: true });

      return await servePortalResponse(supabase, tokenData, contact, bodyToken, corsHeaders);
    }

    // ── verify token ───────────────────────────────────────
    if (action === "verify" && token) {
      console.log(`Portal verify request for token: ${token.substring(0, 8)}...`);

      const { data: tokenData, error: tokenError } = await lookupToken(supabase, token);

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired access link" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "This access link has expired" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      await supabase
        .from("contact_access_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      const { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", tokenData.contact_id)
        .single();

      if (!contact) {
        return new Response(
          JSON.stringify({ error: "Contact not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: questions } = await supabase
        .from("security_questions")
        .select("*")
        .eq("user_id", tokenData.user_id);

      const applicableQuestion = findApplicableQuestion(questions || [], contact);

      if (applicableQuestion) {
        const contactDisplayName = contact.email || "Trusted Contact";
        return new Response(
          JSON.stringify({
            requiresAuth: true,
            question: applicableQuestion.question,
            hint: applicableQuestion.hint || null,
            contactName: contactDisplayName,
            userName: "the vault owner",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return await servePortalResponse(supabase, tokenData, contact, token, corsHeaders);
    }

    // ── generate-token ─────────────────────────────────────
    if (action === "generate-token" && req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userSupabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claims, error: claimsError } = await userSupabase.auth.getUser();
      if (claimsError || !claims?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const body = await req.json();
      const { contactId } = body;

      if (!contactId) {
        return new Response(
          JSON.stringify({ error: "Missing contactId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: contact } = await supabase
        .from("contacts")
        .select("id, user_id")
        .eq("id", contactId)
        .eq("user_id", claims.user.id)
        .single();

      if (!contact) {
        return new Response(
          JSON.stringify({ error: "Contact not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Generate raw token
      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const newToken = Array.from(tokenArray)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Store ONLY the hash
      const tokenHash = await hashTokenForStorage(newToken);

      await supabase
        .from("contact_access_tokens")
        .update({ is_active: false })
        .eq("contact_id", contactId)
        .eq("user_id", claims.user.id);

      const { error: insertError } = await supabase
        .from("contact_access_tokens")
        .insert({
          contact_id: contactId,
          user_id: claims.user.id,
          token: tokenHash,
          is_active: true,
        });

      if (insertError) {
        console.error("Error creating token:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate token" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Return raw token to client (only time it exists in plaintext)
      return new Response(
        JSON.stringify({ token: newToken }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in contact-portal:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

function findApplicableQuestion(questions: any[], contact: any): any | null {
  if (!questions || questions.length === 0) return null;

  const contactSpecific = questions.find(
    (q: any) => q.target_type === "contact" && q.target_contact_id === contact.id
  );
  if (contactSpecific) return contactSpecific;

  const categorySpecific = questions.find(
    (q: any) =>
      q.target_type === "category" && q.target_contact_type === contact.contact_type
  );
  if (categorySpecific) return categorySpecific;

  const allContacts = questions.find((q: any) => q.target_type === "all");
  if (allContacts) return allContacts;

  return null;
}

serve(handler);
