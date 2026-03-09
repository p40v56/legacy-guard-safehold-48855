import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS: Record<string, string> = {
  essential: "price_1T8pfk4l2Z69KbrEXeZwfhtT",
  family: "price_1T8pgN4l2Z69KbrELUqkRtcG",
};

// Annual prices in pence (GBP)
const PLAN_PRICES_PENCE: Record<string, number> = {
  free: 0,
  essential: 4900,
  family: 9900,
};

const PLAN_LABELS: Record<string, string> = {
  essential: "Essential",
  family: "Family",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { plan } = await req.json();
    if (!plan || !PRICE_IDS[plan]) throw new Error(`Invalid plan: ${plan}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://legacy-guard-safehold-48855.lovable.app";

    // Check current plan for prorated upgrade
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("user_id", user.id)
      .single();

    const currentPlan = profile?.plan || "free";
    const currentExpiry = profile?.plan_expires_at;
    const currentPrice = PLAN_PRICES_PENCE[currentPlan] || 0;
    const targetPrice = PLAN_PRICES_PENCE[plan] || 0;

    const isProrated = currentPlan !== "free" && currentExpiry && targetPrice > currentPrice;

    let lineItems: any[];
    let metadata: Record<string, string> = {
      user_id: user.id,
      plan: plan,
    };

    if (isProrated) {
      // Calculate remaining fraction of the current plan
      const now = new Date();
      const expiryDate = new Date(currentExpiry);
      const msRemaining = expiryDate.getTime() - now.getTime();

      if (msRemaining <= 0) {
        // Plan already expired, charge full price
        lineItems = [{ price: PRICE_IDS[plan], quantity: 1 }];
      } else {
        const msInYear = 365.25 * 24 * 60 * 60 * 1000;
        const fractionRemaining = Math.min(msRemaining / msInYear, 1);
        const priceDifference = targetPrice - currentPrice;
        const proratedAmount = Math.max(Math.round(priceDifference * fractionRemaining), 100); // minimum £1

        const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

        lineItems = [{
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Upgrade to ${PLAN_LABELS[plan]}`,
              description: `Prorated upgrade for ${daysRemaining} remaining days (from ${PLAN_LABELS[currentPlan]} to ${PLAN_LABELS[plan]})`,
            },
            unit_amount: proratedAmount,
          },
          quantity: 1,
        }];

        metadata.prorated = "true";
        metadata.previous_plan = currentPlan;
        metadata.keep_expiry = currentExpiry; // keep the same expiry date
      }
    } else {
      lineItems = [{ price: PRICE_IDS[plan], quantity: 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/settings?tab=account&payment=success&plan=${plan}`,
      cancel_url: `${origin}/settings?tab=account&payment=cancelled`,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
