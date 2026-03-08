import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

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
  switch_triggered_at: string | null;
  email_checkin_enabled: boolean;
  check_in_frequency: string;
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

/**
 * Check whether a contact should be notified based on activation rules and delay_hours.
 * Returns true if the contact is eligible for notification at this point in time.
 */
function shouldNotifyContact(
  contact: Contact,
  activationRules: ActivationRule[],
  switchTriggeredAt: string | null,
  now: Date
): boolean {
  // If no activation rules exist, notify all contacts immediately
  if (activationRules.length === 0) return true;
  if (!switchTriggeredAt) return true;

  const triggeredTime = new Date(switchTriggeredAt).getTime();
  const elapsedHours = (now.getTime() - triggeredTime) / (1000 * 60 * 60);

  // Find the minimum delay_hours that applies to this contact from enabled rules
  let applicableDelayHours: number | null = null;

  for (const rule of activationRules) {
    if (!rule.enabled) continue;

    let ruleAppliesToContact = false;

    if (rule.target_type === "contacts" && rule.contact_ids?.includes(contact.id)) {
      ruleAppliesToContact = true;
    } else if (rule.target_type === "category" && rule.contact_category === contact.contact_type) {
      ruleAppliesToContact = true;
    }

    if (ruleAppliesToContact) {
      if (applicableDelayHours === null || rule.delay_hours < applicableDelayHours) {
        applicableDelayHours = rule.delay_hours;
      }
    }
  }

  // If no rule specifically targets this contact, notify immediately (backward compatible)
  if (applicableDelayHours === null) return true;

  return elapsedHours >= applicableDelayHours;
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

  // Check notification preferences — skip email if email_notifications is off
  const { data: notifSettings } = await supabase
    .from("notification_settings")
    .select("email_notifications")
    .eq("user_id", userId)
    .maybeSingle();

  if (notifSettings && notifSettings.email_notifications === false) {
    console.log(`User ${userId} has email notifications disabled, skipping grace period warning email`);
    return { success: true };
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

  // Generate a one-click check-in token only if email check-in is enabled
  let checkInUrl: string | null = null;
  if (userSettings.email_checkin_enabled) {
    try {
      const checkInToken = crypto.randomUUID();
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('check_in_tokens').insert({
        user_id: userId,
        token: checkInToken,
        expires_at: tokenExpiry,
        method: 'email_link',
      });
      checkInUrl = `${APP_BASE_URL}/functions/v1/check-in-via-token?token=${checkInToken}`;
    } catch (tokenErr) {
      console.error("Failed to generate check-in token:", tokenErr);
    }
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
        checkInUrl,
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

  // Only update switch_triggered if not already set
  if (!userSettings.switch_triggered) {
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
  }

  const switchTriggeredAt = userSettings.switch_triggered_at || now.toISOString();

  // Build query for already-sent notifications — only consider those sent AFTER the current trigger
  let alreadySentQuery = supabase
    .from("sent_notifications")
    .select("contact_id")
    .eq("user_id", userId)
    .eq("notification_type", "switch_triggered")
    .eq("status", "sent");

  // Only skip contacts notified after the current switch trigger time
  if (switchTriggeredAt) {
    alreadySentQuery = alreadySentQuery.gte("sent_at", switchTriggeredAt);
  }

  const [contactsRes, typePermissionsRes, rulesRes, alreadySentRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("user_id", userId).eq("can_receive_messages", true),
    supabase.from("contact_type_permissions").select("*").eq("user_id", userId),
    supabase.from("activation_rules").select("*").eq("user_id", userId).eq("enabled", true),
    alreadySentQuery,
  ]);

  const contacts = (contactsRes.data || []) as Contact[];
  const typePermissions = (typePermissionsRes.data || []) as ContactTypePermission[];
  const activationRules = (rulesRes.data || []) as ActivationRule[];
  const alreadySentContactIds = new Set((alreadySentRes.data || []).map((r: any) => r.contact_id));

  console.log(`Processing ${contacts.length} contacts with ${activationRules.length} activation rules`);

  const results: any[] = [];

  for (const contact of contacts) {
    if (!contact.email) {
      console.log(`Skipping contact (no email)`);
      continue;
    }

    // Skip contacts already notified
    if (alreadySentContactIds.has(contact.id)) {
      console.log(`Skipping contact ${contact.id} — already notified`);
      continue;
    }

    // Check delay_hours from activation rules
    if (!shouldNotifyContact(contact, activationRules, switchTriggeredAt, now)) {
      console.log(`Skipping contact ${contact.id} — delay_hours not yet reached`);
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

  // Secret-based auth check for cron calls
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    if (providedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
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
      .or("is_active.eq.true,switch_triggered.eq.true");

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${activeSettings?.length || 0} active/triggered users`);

    const results = {
      gracePeriodStarted: [] as any[],
      switchTriggered: [] as any[],
      delayedNotificationsSent: [] as any[],
    };

    const settingsList = (activeSettings || []) as UserSettings[];

    for (const settings of settingsList) {
      const userId = settings.user_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Handle already-triggered switches with pending delayed notifications
      if (settings.switch_triggered && settings.switch_triggered_at) {
        const triggerResult = await triggerSwitch(supabase, supabaseUrl, supabaseServiceKey, settings, profile);
        if (triggerResult.results.length > 0) {
          results.delayedNotificationsSent.push({ userId, ...triggerResult });
        }
        continue;
      }

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

      // Plan expiry warnings: notify at 7 days and 1 day before expiry
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan, plan_expires_at')
          .eq('user_id', userId)
          .single();

        if (profileData?.plan_expires_at && profileData.plan !== 'free') {
          const expiresAt = new Date(profileData.plan_expires_at);
          const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
            const reminderKey = daysUntilExpiry <= 1 ? 'plan_expiry_1d' : 'plan_expiry_7d';

            const { data: existingReminder } = await supabase
              .from('sent_notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('notification_type', reminderKey)
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .limit(1);

            if (!existingReminder || existingReminder.length === 0) {
              const userEmail = await getUserEmail(supabase, userId);
              const planLabel = profileData.plan === 'family' ? 'Family' : 'Essential';
              const daysLabel = daysUntilExpiry <= 1 ? 'tomorrow' : 'in 7 days';

              if (userEmail) {
                await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
                  body: JSON.stringify({
                    notificationType: 'plan_expiry_warning',
                    recipientEmail: userEmail,
                    planLabel,
                    daysLabel,
                    expiresAt: expiresAt.toISOString(),
                    appUrl: APP_BASE_URL,
                  }),
                });

                await supabase.from('sent_notifications').insert({
                  user_id: userId,
                  contact_id: userId,
                  notification_type: reminderKey,
                  status: 'sent',
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Plan expiry check error:', err);
      }

      // Pre-deadline reminder: warn at 48h and 24h before deadline
      if (deadline && !settings.grace_period_active && !settings.switch_triggered) {
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 48) {
          const reminderKey = hoursUntilDeadline <= 24 ? 'reminder_24h' : 'reminder_48h';
          const { data: existingReminder } = await supabase
            .from('sent_notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('notification_type', reminderKey)
            .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!existingReminder || existingReminder.length === 0) {
            const userEmail = await getUserEmail(supabase, userId);
            if (userEmail) {
              const hoursLabel = hoursUntilDeadline <= 24 ? '24 hours' : '48 hours';
              const checkInUrl = `${APP_BASE_URL}/switch`;

              await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
                body: JSON.stringify({
                  notificationType: 'grace_period_warning',
                  recipientEmail: userEmail,
                  recipientName: 'Vault Owner',
                  gracePeriodHours: hoursLabel,
                  graceEndDate: deadline.toISOString(),
                  userName: userEmail,
                  isPreDeadlineReminder: true,
                  checkInUrl,
                }),
              });

              // Use a dummy contact_id for system notifications to the user themselves
              await supabase.from('sent_notifications').insert({
                user_id: userId,
                contact_id: userId,
                notification_type: reminderKey,
                status: 'sent',
              });

              (results as any).preDeadlineRemindersSent = ((results as any).preDeadlineRemindersSent || 0) + 1;
            }
          }
        }
      }
    }

    console.log(
      `=== Results: ${results.gracePeriodStarted.length} grace periods, ${results.switchTriggered.length} triggers, ${results.delayedNotificationsSent.length} delayed ===`
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