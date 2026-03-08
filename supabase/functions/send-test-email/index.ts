import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const APP_URL = Deno.env.get("APP_BASE_URL");
const ALLOWED_ORIGINS = [
  "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
  "https://6cf11843-b093-41a4-b4d5-f63b642b4451.lovableproject.com",
  "https://legacy-guard-safehold-48855.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(APP_URL ? [APP_URL] : []),
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

function resolveTemplate(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

function buildGracePeriodHtml(userName: string, intro: string, gracePeriodHours: string): string {
  return `<!DOCTYPE html><html><body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="margin:0; font-size:24px;">⚠️ Grace Period Started</h1><p style="margin:12px 0 0; opacity:0.9; font-size:14px;">Dead Man's Switch Warning</p></div><div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;"><p>Hello <strong>${userName}</strong>,</p><p style="color:#4b5563;">${intro} A <strong>${gracePeriodHours}-hour grace period</strong> has now started.</p><div style="background:#fee2e2; border:2px solid #ef4444; padding:20px; border-radius:8px; text-align:center; margin:24px 0;"><p style="color:#991b1b; font-weight:600;">⏰ GRACE PERIOD ENDS:</p><p style="color:#dc2626; font-size:18px; font-weight:700;">${formatDateTime(new Date(Date.now() + parseInt(gracePeriodHours) * 60 * 60 * 1000).toISOString())}</p></div><hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;"><p style="font-size:13px; color:#9ca3af; text-align:center;">This email was sent by your Dead Man's Switch system.</p></div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { templateType, action } = await req.json();

    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    const userName = "the vault owner";
    const userEmail = user.email;

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "No email found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch user settings for grace period hours
    const { data: userSettings } = await supabase.from("user_settings").select("grace_period_hours").eq("user_id", user.id).single();
    const gracePeriodHours = String(userSettings?.grace_period_hours || 24);

    const vars = { userName, contactName: "Test Contact", triggerDate: formatDateTime(new Date().toISOString()), gracePeriodHours };

    let subject: string;
    let html: string;

    if (templateType === "switch_triggered") {
      // Build switch triggered preview using the same template as send-notification
      const headerTitle = profile?.email_header_title || "🚨 Important Notification";
      const headerSubtitle = profile?.email_header_subtitle || "Dead Man's Switch Activated";
      const introMessage = resolveTemplate(
        profile?.email_intro_message || "This is an automated message from {userName}'s Dead Man's Switch system. The system has been activated because they have not checked in within their specified timeframe, and the grace period has now expired.",
        vars
      );
      const footerMessage = profile?.email_footer_message || "This is an automated message from the Dead Man's Switch system. Please keep this information confidential and use it responsibly.";

      subject = resolveTemplate(profile?.email_subject || "🚨 Important: Message from {userName}'s Dead Man's Switch", vars);
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: #2563eb; color: white; padding: 12px 20px; text-align: center; border-radius: 12px 12px 0 0; font-size: 14px; font-weight: 600;">📧 This is a preview — no data has been sent</div><div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 32px; text-align: center;"><h1 style="margin: 0; font-size: 24px; font-weight: 600;">${headerTitle}</h1><p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">${headerSubtitle}</p></div><div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;"><p style="font-size: 16px; margin: 0 0 20px 0;">Dear <strong>Trusted Contact</strong>,</p><p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${introMessage}</p><p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${userName} has designated you as a trusted contact and has authorized the following information to be shared with you:</p><div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; text-align: center; border-radius: 8px; margin: 20px 0;"><p style="color: #15803d; margin: 0; font-weight: 600;">All your personalised content and documents are available securely in your portal.</p><p style="color: #6b7280; margin: 8px 0 0 0; font-size: 13px;">Use the secure access link below to view everything ${userName} has prepared for you.</p></div><div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;"><h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px;">🔐 Access Your Document Portal</h3><p style="color: #047857; margin: 0 0 16px 0; font-size: 14px;">You can view your authorized documents online at any time using the secure link below:</p><span style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Open Document Portal →</span><p style="color: #6b7280; margin: 12px 0 0 0; font-size: 12px;">This link is private and unique to you. Do not share it with others.</p></div><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;"><p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">${footerMessage}</p></div></body></html>`;
    } else if (templateType === "grace_period") {
      subject = resolveTemplate(profile?.email_grace_subject || "⚠️ Grace Period Started - Check In Required", vars);
      const intro = resolveTemplate(profile?.email_grace_intro || "Your Dead Man's Switch has detected that you did not check in by your scheduled deadline.", vars);
      html = buildGracePeriodHtml(userName, intro, gracePeriodHours);
    } else {
      subject = resolveTemplate(profile?.email_subject || "🚨 Important: Message from {userName}'s Dead Man's Switch", vars);
      const headerTitle = profile?.email_header_title || "🚨 Important Notification";
      const headerSubtitle = profile?.email_header_subtitle || "Dead Man's Switch Activated";
      const introMessage = resolveTemplate(profile?.email_intro_message || "This is an automated message from {userName}'s Dead Man's Switch system.", vars);
      const footerMessage = profile?.email_footer_message || "This is an automated message. Please keep this information confidential.";
      html = `<!DOCTYPE html><html><body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="margin:0; font-size:24px;">${headerTitle}</h1><p style="margin:12px 0 0; opacity:0.9; font-size:14px;">${headerSubtitle}</p></div><div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;"><p>Dear <strong>Test Contact</strong>,</p><p style="color:#4b5563;">${introMessage}</p><div style="background:#f3f4f6; padding:24px; text-align:center; border-radius:8px; margin:20px 0;"><p style="color:#6b7280;">📄 Your shared documents and messages would appear here.</p></div><hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;"><p style="font-size:13px; color:#9ca3af; text-align:center;">${footerMessage}</p></div></body></html>`;
    }

    // Preview-only mode: return HTML without sending
    if (action === "preview") {
      return new Response(JSON.stringify({ html }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Send mode — mark as test
    subject = `[TEST] ${subject}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Dead Man's Switch <onboarding@resend.dev>", to: [userEmail], subject, html }),
    });

    const emailResponse = await res.json();
    if (!res.ok) throw new Error(emailResponse.message || "Failed to send email");

    await supabase.from("profiles").update({ last_test_email_sent_at: new Date().toISOString() }).eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-test-email:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
};

serve(handler);