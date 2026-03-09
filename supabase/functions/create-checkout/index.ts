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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // --- Env-var validation ---
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return new Response(
      JSON.stringify({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY in Edge Function secrets." }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }

  const essentialPriceId = Deno.env.get("STRIPE_ESSENTIAL_PRICE_ID");
  const familyPriceId = Deno.env.get("STRIPE_FAMILY_PRICE_ID");
  if (!essentialPriceId || !familyPriceId) {
    return new Response(
      JSON.stringify({ error: "Stripe price IDs are not configured. Set STRIPE_ESSENTIAL_PRICE_ID and STRIPE_FAMILY_PRICE_ID in Edge Function secrets." }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }

  const PRICE_IDS: Record<string, string> = {
    essential: essentialPriceId,
    family: familyPriceId,
  };

  // --- Auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { plan } = await req.json();
    if (!plan || !PRICE_IDS[plan]) throw new Error(`Invalid plan: ${plan}`);

    const priceId = plan === "family" ? familyPriceId : essentialPriceId;

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const appBaseUrl = req.headers.get("origin") || Deno.env.get("APP_BASE_URL") || "https://legacy-guard-safehold-48855.lovable.app";

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
      supabase_user_id: user.id,
      plan: plan,
    };

    if (isProrated) {
      const now = new Date();
      const expiryDate = new Date(currentExpiry);
      const msRemaining = expiryDate.getTime() - now.getTime();

      if (msRemaining <= 0) {
        // Plan already expired, charge full price
        lineItems = [{ price: priceId, quantity: 1 }];
      } else {
        const msInYear = 365.25 * 24 * 60 * 60 * 1000;
        const fractionRemaining = Math.min(msRemaining / msInYear, 1);
        const priceDifference = targetPrice - currentPrice;
        const proratedAmount = Math.max(Math.round(priceDifference * fractionRemaining), 100);

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
        metadata.keep_expiry = currentExpiry;
      }
    } else {
      lineItems = [{ price: priceId, quantity: 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: lineItems,
      mode: "payment",
      success_url: `${appBaseUrl}/settings?tab=account&upgraded=true`,
      cancel_url: `${appBaseUrl}/settings?tab=account`,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
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