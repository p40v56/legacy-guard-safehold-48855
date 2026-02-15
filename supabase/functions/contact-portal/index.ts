import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      // Type defaults as base, contact overrides on top
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
  if (allowedCategories.length === 0) return [];

  return documents.filter((doc: any) => allowedCategories.includes(doc.document_type));
}

const handler = async (req: Request): Promise<Response> => {
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

    // Action: verify-answer - verify security question answer before granting access
    if (action === "verify-answer" && req.method === "POST") {
      const body = await req.json();
      const { token: bodyToken, answer } = body;

      if (!bodyToken || !answer) {
        return new Response(
          JSON.stringify({ error: "Missing token or answer" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Look up the token
      const { data: tokenData, error: tokenError } = await supabase
        .from("contact_access_tokens")
        .select("*")
        .eq("token", bodyToken)
        .eq("is_active", true)
        .single();

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

      // Get contact info
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

      // Find the applicable security question
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

      // Compare answer (case-insensitive, trimmed)
      const normalizedAnswer = answer.trim().toLowerCase();
      const storedAnswer = applicableQuestion.answer_hash.trim().toLowerCase();

      if (normalizedAnswer !== storedAnswer) {
        return new Response(
          JSON.stringify({ error: "Incorrect answer. Please try again." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Answer correct - return the full portal data
      return await servePortalData(supabase, tokenData, contact);
    }

    // Action: verify token - check if token is valid and if security question is required
    if (action === "verify" && token) {
      console.log(`Portal verify request for token: ${token.substring(0, 8)}...`);

      const { data: tokenData, error: tokenError } = await supabase
        .from("contact_access_tokens")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .single();

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

      // Update last accessed
      await supabase
        .from("contact_access_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      // Get contact info
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

      // Check if security question is required
      const { data: questions } = await supabase
        .from("security_questions")
        .select("*")
        .eq("user_id", tokenData.user_id);

      const applicableQuestion = findApplicableQuestion(questions || [], contact);

      if (applicableQuestion) {
        // Security question required - return question only, not data
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", tokenData.user_id)
          .single();

        const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";

        return new Response(
          JSON.stringify({
            requiresAuth: true,
            question: applicableQuestion.question,
            contactName: contact.name,
            userName,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // No security question - serve data directly
      return await servePortalData(supabase, tokenData, contact);
    }

    // Action: generate token (authenticated - for the owner)
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

      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const newToken = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');

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
          token: newToken,
          is_active: true,
        });

      if (insertError) {
        console.error("Error creating token:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate token" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

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
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Find the most specific applicable security question for a contact
function findApplicableQuestion(questions: any[], contact: any): any | null {
  if (!questions || questions.length === 0) return null;

  // Priority 1: Question targeting this specific contact
  const contactSpecific = questions.find(
    (q: any) => q.target_type === 'contact' && q.target_contact_id === contact.id
  );
  if (contactSpecific) return contactSpecific;

  // Priority 2: Question targeting this contact's category
  const categorySpecific = questions.find(
    (q: any) => q.target_type === 'category' && q.target_contact_type === contact.contact_type
  );
  if (categorySpecific) return categorySpecific;

  // Priority 3: Question targeting all contacts
  const allContacts = questions.find((q: any) => q.target_type === 'all');
  if (allContacts) return allContacts;

  return null;
}

// Serve full portal data
async function servePortalData(supabase: any, tokenData: any, contact: any): Promise<Response> {
  const userId = tokenData.user_id;

  const [profileRes, typePermissionsRes, allDocumentsRes, activationRulesRes] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, emergency_instructions").eq("user_id", userId).single(),
    supabase.from("contact_type_permissions").select("*").eq("user_id", userId),
    supabase.from("legacy_documents").select("id, title, content, document_type, description, created_at, file_path").eq("user_id", userId),
    supabase.from("activation_rules").select("*").eq("user_id", userId).eq("enabled", true),
  ]);

  const profile = profileRes.data;
  const typePermissions = typePermissionsRes.data || [];
  const allDocuments = allDocumentsRes.data || [];
  const activationRules = activationRulesRes.data || [];

  const permissions = resolvePermissions(contact, typePermissions);
  const allowedDocuments = filterDocumentsByPermissions(allDocuments, permissions);

  // Get custom message
  let customMessage = contact.custom_message || null;
  if (!customMessage && activationRules) {
    for (const rule of activationRules) {
      if (rule.target_type === 'contacts' && rule.contact_ids?.includes(contact.id)) {
        customMessage = rule.custom_message;
        break;
      }
      if (rule.target_type === 'category' && rule.contact_category === contact.contact_type) {
        customMessage = rule.custom_message;
        break;
      }
    }
  }

  const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";

  console.log(`Portal data served for contact ${contact.name}: ${allowedDocuments.length} documents`);

  return new Response(
    JSON.stringify({
      contactName: contact.name,
      userName,
      customMessage,
      emergencyInstructions: permissions.emergency_instructions ? profile?.emergency_instructions : null,
      documents: allowedDocuments,
      permissions,
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

serve(handler);
