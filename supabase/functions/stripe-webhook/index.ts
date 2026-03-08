import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const handler = async (req: Request): Promise<Response> => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Stripe webhook:", event.type);

    const ESSENTIAL_PRICE_ID = "price_1T8pfk4l2Z69KbrEXeZwfhtT";
    const FAMILY_PRICE_ID = "price_1T8pgN4l2Z69KbrELUqkRtcG";

    const getTier = (priceId: string): string =>
      priceId === FAMILY_PRICE_ID ? "family" : "essential";

    const updateByCustomer = async (customerId: string, updates: Record<string, any>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("stripe_customer_id", customerId);
      if (error) console.error("Profile update error:", error);
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.plan || "essential";
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        if (!userId) { console.error("No supabase_user_id in session metadata"); break; }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
        await supabase.from("profiles").update({
          plan: tier,
          plan_expires_at: expiresAt,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        }).eq("user_id", userId);
        console.log(`Activated ${tier} for user ${userId}, expires ${expiresAt}`);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
        const priceId = sub.items.data[0]?.price.id || "";
        const tier = getTier(priceId);
        if (["active", "trialing"].includes(sub.status)) {
          await updateByCustomer(customerId, {
            plan: tier,
            plan_expires_at: expiresAt,
            stripe_subscription_id: sub.id,
          });
        } else if (["canceled", "unpaid", "past_due"].includes(sub.status)) {
          await updateByCustomer(customerId, {
            plan: "free",
            plan_expires_at: null,
            stripe_subscription_id: null,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateByCustomer(sub.customer as string, {
          plan: "free",
          plan_expires_at: null,
          stripe_subscription_id: null,
        });
        console.log(`Subscription cancelled for customer ${sub.customer}`);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
          const tier = getTier(sub.items.data[0]?.price.id || "");
          await updateByCustomer(invoice.customer as string, {
            plan: tier,
            plan_expires_at: expiresAt,
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for customer ${invoice.customer} — Stripe will retry automatically`);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

serve(handler);