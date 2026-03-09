import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find completed checkout sessions for this user
    const sessions = await stripe.checkout.sessions.list({ limit: 10 });

    let latestPaidPlan: string | null = null;
    let paymentDate: string | null = null;
    let isProrated = false;
    let keepExpiry: string | null = null;

    for (const session of sessions.data) {
      if (
        session.payment_status === "paid" &&
        session.metadata?.user_id === user.id
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ paid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
