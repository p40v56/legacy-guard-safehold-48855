import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const APP_URL = Deno.env.get("APP_BASE_URL");
const ALLOWED_ORIGINS = [
  "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app",
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

// ── Crypto helpers ──────────────────────────────────────────

async function hashTokenForStorage(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const arr = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

// ── Types ───────────────────────────────────────────────────

interface UserSettings {
  user_id: string;
  is_active: boolean;
  deadline_mode: string;
  next_check_in_due: string | null;
  custom_deadline: string | null;
  grace_period_hours: number;
  grace_period_active: boolean;
  grace_period_end: string | null;
  switch_triggered: boolean;
}

interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  contact_type: string;
  permissions: any;
  can_receive_messages: boolean;
  use_type_defaults: boolean;
  custom_message: string | null;
}

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  emergency_instructions: string | null;
  email_subject: string | null;
  email_header_title: string | null;
  email_header_subtitle: string | null;
  email_intro_message: string | null;
  email_footer_message: string | null;
  email_grace_subject: string | null;
  email_grace_intro: string | null;
}

interface Document {
  id: string;
  title: string;
  content: string | null;
  document_type: string;
  description: string | null;
}

interface ActivationRule {
  id: string;
  user_id: string;
  target_type: string | null;
  contact_category: string | null;
  contact_ids: string[] | null;
  delay_hours: number;
  custom_message: string | null;
  enabled: boolean | null;
  action_type: string;
}

interface ContactTypePermission {
  contact_type: string;
  default_permissions: any;
}

const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://id-preview--6cf11843-b093-41a4-b4d5-f63b642b4451.lovable.app";

async function getUserEmail(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.error("Error fetching user email:", error);
    return null;
  }
  return data?.user?.email || null;
}

function getCustomMessageForContact(
  contact: Contact,
  activationRules: ActivationRule[]
): string | null {
  if (contact.custom_message) return contact.custom_message;
  for (const rule of activationRules) {
    if (!rule.enabled) continue;
    if (rule.target_type === "contacts" && rule.contact_ids?.includes(contact.id)) {
      if (rule.custom_message) return rule.custom_message;
    }
    if (rule.target_type === "category" && rule.contact_category === contact.contact_type) {
      if (rule.custom_message) return rule.custom_message;
    }
  }
  return null;
}

function resolvePermissions(contact: Contact, typePermissions: ContactTypePermission[]): any {
  let permissions = contact.permissions || {};
  if (contact.use_type_defaults) {
    const typeDefault = typePermissions.find((tp) => tp.contact_type === contact.contact_type);
    if (typeDefault?.default_permissions) {
      permissions = { ...typeDefault.default_permissions, ...permissions };
    }
  }
  return permissions;
}

function filterDocumentsByPermissions(documents: Document[], permissions: any): Document[] {
  const docPerms = permissions.legacy_documents;
  if (!docPerms) return [];
  if (docPerms.all_documents) return documents;
  const allowedCategories = docPerms.by_category || [];
  if (allowedCategories.length === 0) return [];
  return documents.filter((doc) => allowedCategories.includes(doc.document_type));
}

async function startGracePeriod(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  userSettings: UserSettings,
  profile: Profile | null
): Promise<{ success: boolean; error?: string }> {
  const userId = userSettings.user_id;
  const now = new Date();
  const graceEndDate = new Date(now.getTime() + userSettings.grace_period_hours * 60 * 60 * 1000);

  console.log(`Starting grace period for user ${userId}, ends at ${graceEndDate.toISOString()}`);

  const { error: updateError } = await supabase
    .from("user_settings")
    .update({
      grace_period_active: true,
      grace_period_end: graceEndDate.toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error starting grace period:", updateError);
    return { success: false, error: updateError.message };
  }

  const userEmail = await getUserEmail(supabase, userId);
  const userName = userEmail || "the vault owner";
  const emailTemplate = profile
    ? {
        email_grace_subject: profile.email_grace_subject,
        email_grace_intro: profile.email_grace_intro,
      }
    : {};

  if (!userEmail) {
    console.log(`No email found for user ${userId}, skipping warning email`);
    return { success: true };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        notificationType: "grace_period_warning",
        recipientEmail: userEmail,
        recipientName: userName,
        userName,
        gracePeriodHours: userSettings.grace_period_hours,
        graceEndDate: graceEndDate.toISOString(),
        emailTemplate,
      }),
    });

    const result = await response.json();
    console.log(`Grace period warning email: ${result.success ? "sent" : "failed"}`);
    return { success: result.success, error: result.error };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error sending grace period warning:`, errMessage);
    return { success: false, error: errMessage };
  }
}

async function generatePortalToken(
  supabase: any,
  userId: string,
  contactId: string
): Promise<string | null> {
  const tokenArray = new Uint8Array(32);
  crypto.getRandomValues(tokenArray);
  const rawToken = Array.from(tokenArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Store ONLY the hash
  const tokenHash = await hashTokenForStorage(rawToken);

  await supabase
    .from("contact_access_tokens")
    .update({ is_active: false })
    .eq("contact_id", contactId)
    .eq("user_id", userId);

  const { error } = await supabase.from("contact_access_tokens").insert({
    contact_id: contactId,
    user_id: userId,
    token: tokenHash,
    is_active: true,
  });

  if (error) {
    console.error("Error creating portal token:", error);
    return null;
  }
  return rawToken;
}

async function triggerSwitch(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  userSettings: UserSettings,
  profile: Profile | null
): Promise<{ success: boolean; results: any[] }> {
  const userId = userSettings.user_id;
  const now = new Date();

  console.log(`TRIGGERING SWITCH for user ${userId}`);

  const authEmail = await getUserEmail(supabase, userId);
  const userName = authEmail || "the vault owner";

  const { error: updateError } = await supabase
    .from("user_settings")
    .update({
      switch_triggered: true,
      switch_triggered_at: now.toISOString(),
      is_active: false,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error triggering switch:", updateError);
    return { success: false, results: [] };
  }

  const [contactsRes, typePermissionsRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("user_id", userId).eq("can_receive_messages", true),
    supabase.from("contact_type_permissions").select("*").eq("user_id", userId),
  ]);

  const contacts = (contactsRes.data || []) as Contact[];
  const typePermissions = (typePermissionsRes.data || []) as ContactTypePermission[];

  console.log(`Processing ${contacts.length} contacts`);

  const results: any[] = [];

  for (const contact of contacts) {
    if (!contact.email) {
      console.log(`Skipping contact (no email)`);
      continue;
    }

    const permissions = resolvePermissions(contact, typePermissions);
    const contactLabel = contact.email || contact.id;

    const emailTemplate = profile
      ? {
          email_subject: profile.email_subject,
          email_header_title: profile.email_header_title,
          email_header_subtitle: profile.email_header_subtitle,
          email_intro_message: profile.email_intro_message,
          email_footer_message: profile.email_footer_message,
        }
      : {};

    const portalToken = await generatePortalToken(supabase, userId, contact.id);

    const notificationPayload = {
      notificationType: "switch_triggered",
      contactId: contact.id,
      contactName: "Trusted Contact",
      contactEmail: contact.email,
      contactType: contact.contact_type,
      userName,
      emergencyInstructions: null,
      customMessage: null,
      documents: [],
      permissions,
      emailTemplate,
      portalToken,
      portalBaseUrl: APP_BASE_URL,
    };

    console.log(`Sending notification: portalToken=${portalToken ? "generated" : "none"}`);

    try {
      const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(notificationPayload),
      });

      const sendResult = await sendResponse.json();

      await supabase.from("sent_notifications").insert({
        user_id: userId,
        contact_id: contact.id,
        notification_type: "switch_triggered",
        status: sendResult.success ? "sent" : "failed",
        error_message: sendResult.error || null,
      });

      results.push({
        contactId: contact.id,
        success: sendResult.success,
        error: sendResult.error,
      });

      console.log(`Switch notification: ${sendResult.success ? "sent" : "failed"}`);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error sending to ${contactLabel}:`, errMessage);
      results.push({
        contactId: contact.id,
        success: false,
        error: errMessage,
      });
    }
  }

  return { success: true, results };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== Checking deadlines ===");
    const now = new Date();

    const { data: activeSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("is_active", true);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${activeSettings?.length || 0} active users`);

    const results = {
      gracePeriodStarted: [] as any[],
      switchTriggered: [] as any[],
    };

    const settingsList = (activeSettings || []) as UserSettings[];

    for (const settings of settingsList) {
      const userId = settings.user_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (settings.grace_period_active && settings.grace_period_end) {
        const graceEnd = new Date(settings.grace_period_end);
        if (now > graceEnd && !settings.switch_triggered) {
          console.log(`Grace period ended for user ${userId}, triggering switch`);
          const triggerResult = await triggerSwitch(supabase, supabaseUrl, supabaseServiceKey, settings, profile);
          results.switchTriggered.push({ userId, ...triggerResult });
        }
        continue;
      }

      let deadline: Date | null = null;
      if (settings.deadline_mode === "frequency" && settings.next_check_in_due) {
        deadline = new Date(settings.next_check_in_due);
      } else if (settings.deadline_mode === "custom" && settings.custom_deadline) {
        deadline = new Date(settings.custom_deadline);
      }

      if (deadline && now > deadline && !settings.grace_period_active) {
        console.log(`Deadline passed for user ${userId}: ${deadline.toISOString()}`);
        const graceResult = await startGracePeriod(supabase, supabaseUrl, supabaseServiceKey, settings, profile);
        results.gracePeriodStarted.push({ userId, ...graceResult });
      }
    }

    console.log(
      `=== Results: ${results.gracePeriodStarted.length} grace periods started, ${results.switchTriggered.length} switches triggered ===`
    );

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-deadlines:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    });
  }
};

serve(handler);
