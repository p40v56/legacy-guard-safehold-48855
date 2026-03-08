import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
  "https://legacy-guard-safehold-48855.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Find completed checkout sessions for this user
    const sessions = await stripe.checkout.sessions.list({ limit: 10 });

    let latestPaidPlan: string | null = null;
    let paymentDate: string | null = null;
    let isProrated = false;
    let keepExpiry: string | null = null;

    for (const session of sessions.data) {
      const userId = session.metadata?.supabase_user_id || session.metadata?.user_id;
      if (
        session.payment_status === "paid" &&
        userId === user.id
      ) {
        latestPaidPlan = session.metadata?.plan || null;
        paymentDate = new Date((session.created || 0) * 1000).toISOString();
        isProrated = session.metadata?.prorated === "true";
        keepExpiry = session.metadata?.keep_expiry || null;
        break;
      }
    }

    if (latestPaidPlan) {
      let expiresAt: Date;

      if (isProrated && keepExpiry) {
        // Prorated upgrade: keep the existing expiry date
        expiresAt = new Date(keepExpiry);
      } else {
        // New purchase: 1 year from payment
        expiresAt = new Date(paymentDate!);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Update the user's profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: latestPaidPlan,
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

      // Send upgrade confirmation email (non-blocking)
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey },
          body: JSON.stringify({
            notificationType: "plan_upgrade",
            recipientEmail: user.email,
            planLabel: latestPaidPlan === "family" ? "Family" : "Essential",
            expiresAt: expiresAt.toISOString(),
          }),
        });
      } catch { /* non-blocking */ }

      return new Response(JSON.stringify({
        paid: true,
        plan: latestPaidPlan,
        expires_at: expiresAt.toISOString(),
        prorated: isProrated,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ paid: false }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
