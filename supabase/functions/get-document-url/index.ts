import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const ALLOWED_ORIGINS = [
  "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
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

async function hashTokenForStorage(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const arr = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, documentId, filePath } = await req.json();

    if (!token || !documentId || !filePath) {
      return new Response(
        JSON.stringify({ error: "Missing token, documentId, or filePath" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the token is valid and active
    const tokenHash = await hashTokenForStorage(token);

    // Try hash lookup first, then legacy raw lookup
    let tokenData: any = null;
    const { data: hashResult } = await supabase
      .from("contact_access_tokens")
      .select("*")
      .eq("token", tokenHash)
      .eq("is_active", true)
      .single();

    if (hashResult) {
      tokenData = hashResult;
    } else {
      // Legacy fallback
      const { data: rawResult } = await supabase
        .from("contact_access_tokens")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .single();
      tokenData = rawResult;
    }

    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired access link" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the document belongs to this user and is shared with this contact
    const { data: doc } = await supabase
      .from("legacy_documents")
      .select("id, file_path, user_id")
      .eq("id", documentId)
      .eq("user_id", tokenData.user_id)
      .single();

    if (!doc || doc.file_path !== filePath) {
      return new Response(
        JSON.stringify({ error: "Document not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a signed URL valid for 60 seconds
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to generate download link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-document-url:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
