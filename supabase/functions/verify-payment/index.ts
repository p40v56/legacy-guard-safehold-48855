import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U73ncBe5gTNjZT": "essential",
  "prod_U73ncw0ds80Lqh": "family",
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
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    let latestPaidPlan: string | null = null;
    let paymentDate: string | null = null;

    for (const session of sessions.data) {
      if (
        session.payment_status === "paid" &&
        session.metadata?.user_id === user.id
      ) {
        latestPaidPlan = session.metadata?.plan || null;
        paymentDate = new Date((session.created || 0) * 1000).toISOString();
        break;
      }
    }

    if (latestPaidPlan) {
      // Calculate expiry: 1 year from payment
      const expiresAt = new Date(paymentDate!);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Update the user's profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: latestPaidPlan,
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

      return new Response(JSON.stringify({
        paid: true,
        plan: latestPaidPlan,
        expires_at: expiresAt.toISOString(),
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
