import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    let body: { session_id?: string } = {};
    try { body = await req.json(); } catch { /* body optional */ }
    const sessionId = body.session_id;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency guard: if we've already processed this session, return the recorded outcome.
    const { data: already } = await supabaseAdmin
      .from("processed_stripe_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (already) {
      if (already.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Session does not belong to this user" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan, plan_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      return new Response(JSON.stringify({
        paid: true,
        plan: profile?.plan,
        expires_at: profile?.plan_expires_at,
        prorated: already.prorated,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Fetch the specific session and verify it belongs to this user AND is paid.
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Session does not belong to this user" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ paid: false, status: session.payment_status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = session.metadata?.plan;
    const isProrated = session.metadata?.prorated === "true";
    const keepExpiry = session.metadata?.keep_expiry || null;
    const paymentDate = new Date((session.created || 0) * 1000).toISOString();

    if (!plan) throw new Error("Session missing plan metadata");

    let expiresAt: Date;
    if (isProrated && keepExpiry) {
      expiresAt = new Date(keepExpiry);
    } else {
      expiresAt = new Date(paymentDate);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Idempotently record the processed session BEFORE mutating the profile,
    // so a retry can never double-apply.
    const { error: recordErr } = await supabaseAdmin
      .from("processed_stripe_sessions")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        plan,
        prorated: isProrated,
        keep_expiry: keepExpiry,
      });

    if (recordErr && !String(recordErr.message).includes("duplicate")) {
      throw new Error(`Failed to record session: ${recordErr.message}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        plan,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

    // Send upgrade confirmation email (non-blocking)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
                "X-Internal-Secret": Deno.env.get("NOTIFICATION_INTERNAL_SECRET") ?? "",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          notificationType: "plan_upgrade",
          recipientEmail: user.email,
          planLabel: plan === "family" ? "Family" : "Essential",
          expiresAt: expiresAt.toISOString(),
        }),
      });
    } catch { /* non-blocking */ }

    return new Response(JSON.stringify({
      paid: true,
      plan,
      expires_at: expiresAt.toISOString(),
      prorated: isProrated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    return new Response(JSON.stringify({ error: "Failed to verify payment" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
