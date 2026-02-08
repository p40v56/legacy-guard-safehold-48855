import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Action: verify token and return portal data
    if (action === "verify" && token) {
      console.log(`Portal verify request for token: ${token.substring(0, 8)}...`);

      // Look up the token
      const { data: tokenData, error: tokenError } = await supabase
        .from("contact_access_tokens")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .single();

      if (tokenError || !tokenData) {
        console.log("Token not found or inactive:", tokenError?.message);
        return new Response(
          JSON.stringify({ error: "Invalid or expired access link" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check expiration if set
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        console.log("Token expired");
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
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", tokenData.contact_id)
        .single();

      if (contactError || !contact) {
        console.log("Contact not found:", contactError?.message);
        return new Response(
          JSON.stringify({ error: "Contact not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const userId = tokenData.user_id;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, emergency_instructions")
        .eq("user_id", userId)
        .single();

      // Get contact type permissions
      const { data: typePermissions } = await supabase
        .from("contact_type_permissions")
        .select("*")
        .eq("user_id", userId);

      // Determine permissions for this contact
      let permissions = contact.permissions || {};
      if (contact.use_type_defaults) {
        const typeDefault = (typePermissions || []).find(
          (tp: any) => tp.contact_type === contact.contact_type
        );
        if (typeDefault) {
          permissions = { ...typeDefault.default_permissions, ...permissions };
        }
      }

      // Get documents filtered by permissions
      const { data: allDocuments } = await supabase
        .from("legacy_documents")
        .select("id, title, content, document_type, description, created_at")
        .eq("user_id", userId);

      const allowedDocuments = (allDocuments || []).filter((doc: any) => {
        const docTypeKey = `documents_${doc.document_type}`;
        return permissions[docTypeKey] === true;
      });

      // Get custom message for this contact
      const { data: activationRules } = await supabase
        .from("activation_rules")
        .select("*")
        .eq("user_id", userId)
        .eq("enabled", true);

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

      // Verify the contact belongs to this user
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

      // Generate token
      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const newToken = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');

      // Deactivate existing tokens
      await supabase
        .from("contact_access_tokens")
        .update({ is_active: false })
        .eq("contact_id", contactId)
        .eq("user_id", claims.user.id);

      // Create new token
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

      console.log(`Portal token generated for contact ${contactId}`);

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

serve(handler);
