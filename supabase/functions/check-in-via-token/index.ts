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

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(generateHtml("❌ Invalid Link", "No token provided."), {
        status: 400, headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokenData, error: tokenError } = await supabase
      .from("check_in_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (tokenError || !tokenData) {
      return new Response(generateHtml("❌ Invalid or Expired Link", "This check-in link is no longer valid."), {
        status: 400, headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(generateHtml("⏰ Link Expired", "This check-in link has expired. Please use the app to check in."), {
        status: 400, headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    const userId = tokenData.user_id;
    const now = new Date().toISOString();

    const { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", userId).single();

    let nextCheckInDue = null;
    if (settings?.is_active && settings.deadline_mode === "frequency") {
      const freq = settings.check_in_frequency;
      const next = new Date();
      switch (freq) {
        case "daily": next.setDate(next.getDate() + 1); break;
        case "weekly": next.setDate(next.getDate() + 7); break;
        case "biweekly": next.setDate(next.getDate() + 14); break;
        case "monthly": next.setMonth(next.getMonth() + 1); break;
      }
      nextCheckInDue = next.toISOString();
    }

    await supabase.from("user_settings").update({
      last_check_in: now, next_check_in_due: nextCheckInDue,
      grace_period_active: false, grace_period_end: null,
      switch_triggered: false, switch_triggered_at: null,
    }).eq("user_id", userId);

    await supabase.from("check_in_tokens").update({ used_at: now }).eq("id", tokenData.id);
    await supabase.from("check_in_history").insert({ user_id: userId, method: tokenData.method, checked_in_at: now });

    return new Response(generateHtml("✅ Check-in Successful", "Your Dead Man's Switch timer has been reset. You're all set!"), {
      status: 200, headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-in-via-token:", msg);
    return new Response(generateHtml("❌ Error", "Something went wrong. Please try again or use the app."), {
      status: 500, headers: { "Content-Type": "text/html", ...getCorsHeaders(req) },
    });
  }
};

function generateHtml(title: string, message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head><body style="font-family: -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f9fafb;"><div style="text-align:center; padding:40px; max-width:400px;"><h1 style="font-size:48px; margin-bottom:16px;">${title.split(" ")[0]}</h1><h2 style="color:#111827; margin-bottom:8px;">${title}</h2><p style="color:#6b7280;">${message}</p></div></body></html>`;
}

serve(handler);
