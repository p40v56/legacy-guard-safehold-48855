import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeaders, sha256Base64, timingSafeEqual } from "../_shared/cors.ts";

// Email check-in flow:
//   GET  ?token=... → renders a "Confirm check-in" HTML page (no state change).
//   POST ?token=... → performs the check-in (single-use, hashed lookup, timing-safe compare).
//
// IMPORTANT: this must produce the SAME next deadline as a website check-in.
// The client-side source of truth lives in src/lib/deadlines.ts —
// the `nextCheckInFromFrequency` helper below MUST match it day-for-day
// (daily +1d, weekly +7d, biweekly +14d, monthly +1 calendar month via setMonth).

type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | string;

function nextCheckInFromFrequency(frequency: Frequency, fromDate: Date): string {
  const next = new Date(fromDate);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      // Unknown frequency: fall back to +7d rather than +24h to stay safe.
      next.setDate(next.getDate() + 7);
  }
  return next.toISOString();
}

function formatEU(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const pathToken = pathParts[pathParts.length - 1];
    const token = pathToken && pathToken !== "check-in-via-token"
      ? pathToken
      : url.searchParams.get("token") || "";

    if (!token) {
      return htmlResponse("❌ Invalid Link", "No token provided.", 400, corsHeaders);
    }

    if (req.method === "GET") {
      return confirmPage(token, corsHeaders);
    }

    if (req.method !== "POST") {
      return htmlResponse("❌ Method Not Allowed", "Use POST to confirm.", 405, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenHash = await sha256Base64(token);

    const { data: tokenData } = await supabase
      .from("check_in_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .maybeSingle();

    if (!tokenData || !timingSafeEqual(tokenData.token_hash, tokenHash)) {
      return htmlResponse("❌ Invalid or Expired Link", "This check-in link is no longer valid.", 400, corsHeaders);
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return htmlResponse("⏰ Link Expired", "This check-in link has expired. Please use the app to check in.", 400, corsHeaders);
    }

    const userId = tokenData.user_id;
    const now = new Date();
    const nowIso = now.toISOString();

    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // BUG 3: if switch already fired, do NOT un-trigger it.
    // Contacts may already have portal links and notifications may already have gone out.
    if (settings?.switch_triggered === true) {
      // Consume the token so it can't be replayed, but change no other state.
      await supabase.from("check_in_tokens").update({ used_at: nowIso }).eq("id", tokenData.id);
      return htmlResponse(
        "⚠️ Switch Already Activated",
        "Your dead-man's switch has already activated and your trusted contacts may already have access to your vault. This check-in link can no longer reset it. Please log in to the app or contact support.",
        409,
        corsHeaders,
      );
    }

    // Compute next deadline using the SAME rule the website uses.
    let nextCheckInDue: string | null = null;
    let successMessage: string;

    if (settings?.is_active && settings.deadline_mode === "frequency") {
      // BUG 1: use the user's real frequency, not a hardcoded +24h.
      nextCheckInDue = nextCheckInFromFrequency(settings.check_in_frequency, now);
      successMessage = `Check-in complete. Your next check-in is due on ${formatEU(nextCheckInDue)}.`;
    } else if (settings?.is_active && settings.deadline_mode === "custom") {
      // BUG 2: a fixed calendar deadline can't be "reset" by a check-in.
      // Leave grace/deadline state UNTOUCHED (so we don't create an inconsistent state
      // where next_check_in_due is nulled but custom_deadline is still in the past),
      // and just consume the token. The user must log in to review or extend.
      await supabase.from("check_in_tokens").update({ used_at: nowIso }).eq("id", tokenData.id);
      return htmlResponse(
        "ℹ️ Log in to Extend Your Deadline",
        "Your account uses a fixed calendar deadline, which can't be reset from an email link. Please log in to the app to review or extend your deadline.",
        200,
        corsHeaders,
      );
    } else {
      // Not active — no deadline to compute. Still allow the check-in to record activity.
      successMessage = "Check-in recorded.";
    }

    // Normal check-in path (frequency mode, or inactive).
    // Clear grace only when switch has NOT triggered (guarded above).
    const updatePayload: Record<string, unknown> = {
      last_check_in: nowIso,
      grace_period_active: false,
      grace_period_end: null,
    };
    if (nextCheckInDue !== null) {
      updatePayload.next_check_in_due = nextCheckInDue;
    }

    await supabase.from("user_settings").update(updatePayload).eq("user_id", userId);

    await supabase.from("check_in_tokens").update({ used_at: nowIso }).eq("id", tokenData.id);
    await supabase.from("check_in_history").insert({
      user_id: userId,
      method: tokenData.method,
      checked_in_at: nowIso,
    });

    return htmlResponse("✅ Check-in Successful", successMessage, 200, corsHeaders);
  } catch (error) {
    console.error("check-in-via-token error:", error);
    return htmlResponse("❌ Error", "Something went wrong. Please try again or use the app.", 500, getCorsHeaders(req));
  }
};

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function confirmPage(token: string, corsHeaders: Record<string, string>): Response {
  const safeToken = escapeAttr(token);
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm check-in</title></head>
<body style="font-family:-apple-system,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb">
<div style="text-align:center;padding:32px;max-width:440px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.06)">
<h1 style="color:#111827;margin:0 0 8px;font-size:22px">Confirm check-in</h1>
<p style="color:#6b7280;margin:0 0 24px;font-size:14px">Click the button below to record your check-in. Your next deadline will be set from your current check-in frequency, matching a website check-in.</p>
<form method="POST" action="?token=${safeToken}">
<button type="submit" style="background:#059669;color:#fff;padding:12px 28px;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">✓ I'm alive — check me in</button>
</form>
<p style="color:#9ca3af;margin:20px 0 0;font-size:12px">Single-use link.</p>
</div></body></html>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders },
  });
}

function htmlResponse(title: string, message: string, status: number, corsHeaders: Record<string, string>): Response {
  const safeTitle = title.replace(/[<>&]/g, "");
  const safeMsg = message.replace(/[<>&]/g, "");
  const icon = safeTitle.split(" ")[0];
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title></head><body style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb"><div style="text-align:center;padding:40px;max-width:440px"><h1 style="font-size:48px;margin-bottom:16px">${icon}</h1><h2 style="color:#111827;margin-bottom:8px">${safeTitle}</h2><p style="color:#6b7280">${safeMsg}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } },
  );
}

serve(handler);
