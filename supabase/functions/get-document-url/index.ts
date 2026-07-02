import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeaders, timingSafeEqual, sha256Base64 } from "../_shared/cors.ts";

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, documentId, filePath } = await req.json();
    if (!token || !documentId || !filePath) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tokenHash = await sha256Base64(token);
    const { data: tokenData } = await supabase
      .from("contact_access_tokens")
      .select("*")
      .eq("token", tokenHash)
      .eq("is_active", true)
      .maybeSingle();

    if (!tokenData || !timingSafeEqual(tokenData.token, tokenHash)) {
      return new Response(JSON.stringify({ error: "Invalid or expired access link" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invalid or expired access link" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Trigger gate: only serve documents after the owner's switch has fired.
    const { data: settings } = await supabase
      .from("user_settings")
      .select("switch_triggered")
      .eq("user_id", tokenData.user_id)
      .maybeSingle();

    if (!settings?.switch_triggered) {
      return new Response(JSON.stringify({ error: "This vault has not been released yet." }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: doc } = await supabase
      .from("legacy_documents")
      .select("id, file_path, user_id")
      .eq("id", documentId)
      .eq("user_id", tokenData.user_id)
      .maybeSingle();

    if (!doc || doc.file_path !== filePath) {
      return new Response(JSON.stringify({ error: "Document not found or access denied" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: share } = await supabase
      .from("contact_shares")
      .select("shared_document_ids")
      .eq("contact_id", tokenData.contact_id)
      .eq("user_id", tokenData.user_id)
      .maybeSingle();

    if (!share) {
      return new Response(JSON.stringify({ error: "No portal share found for this contact" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const sharedIds: string[] = share.shared_document_ids || [];
    if (sharedIds.length > 0 && !sharedIds.includes(documentId)) {
      return new Response(JSON.stringify({ error: "This document was not shared with you" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: signed, error: signedErr } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);

    if (signedErr || !signed) {
      console.error("Signed URL error:", signedErr);
      return new Response(JSON.stringify({ error: "Failed to generate download link" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("get-document-url error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    });
  }
};

serve(handler);
