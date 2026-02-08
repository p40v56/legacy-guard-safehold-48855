import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  permissions: Record<string, boolean>;
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
  default_permissions: Record<string, boolean>;
}

// Get user's email from auth.users
async function getUserEmail(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.error("Error fetching user email:", error);
    return null;
  }
  return data?.user?.email || null;
}

// Find the custom_message for a contact from activation rules
function getCustomMessageForContact(
  contact: Contact,
  activationRules: ActivationRule[]
): string | null {
  // First check contact-level custom_message
  if (contact.custom_message) {
    return contact.custom_message;
  }

  // Then check activation rules
  for (const rule of activationRules) {
    if (!rule.enabled) continue;

    // Check if the rule targets this specific contact
    if (rule.target_type === 'contacts' && rule.contact_ids?.includes(contact.id)) {
      if (rule.custom_message) return rule.custom_message;
    }

    // Check if the rule targets this contact's category
    if (rule.target_type === 'category' && rule.contact_category === contact.contact_type) {
      if (rule.custom_message) return rule.custom_message;
    }
  }

  return null;
}

// Phase 1: Start grace period and notify the user
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
  
  if (!userEmail) {
    console.log(`No email found for user ${userId}, skipping warning email`);
    return { success: true };
  }
  
  const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";
  
  const emailTemplate = profile ? {
    email_grace_subject: profile.email_grace_subject,
    email_grace_intro: profile.email_grace_intro,
  } : {};
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        notificationType: "grace_period_warning",
        recipientEmail: userEmail,
        recipientName: userName,
        userName: userName,
        gracePeriodHours: userSettings.grace_period_hours,
        graceEndDate: graceEndDate.toISOString(),
        emailTemplate,
      }),
    });
    
    const result = await response.json();
    console.log(`Grace period warning email to ${userEmail}: ${result.success ? "sent" : "failed"}`);
    return { success: result.success, error: result.error };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error sending grace period warning:`, errMessage);
    return { success: false, error: errMessage };
  }
}

// Generate portal access token for a contact
async function generatePortalToken(supabase: any, userId: string, contactId: string): Promise<string | null> {
  // Generate a secure random token
  const tokenArray = new Uint8Array(32);
  crypto.getRandomValues(tokenArray);
  const token = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Deactivate any existing tokens for this contact
  await supabase
    .from("contact_access_tokens")
    .update({ is_active: false })
    .eq("contact_id", contactId)
    .eq("user_id", userId);
  
  // Create new token (no expiry - active until explicitly deactivated)
  const { error } = await supabase
    .from("contact_access_tokens")
    .insert({
      contact_id: contactId,
      user_id: userId,
      token: token,
      is_active: true,
    });
  
  if (error) {
    console.error("Error creating portal token:", error);
    return null;
  }
  
  return token;
}

// Phase 2: Trigger the switch and notify all contacts
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
  
  // Get user's contacts, documents, activation rules, and type permissions
  const [contactsRes, documentsRes, typePermissionsRes, activationRulesRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("user_id", userId).eq("can_receive_messages", true),
    supabase.from("legacy_documents").select("*").eq("user_id", userId),
    supabase.from("contact_type_permissions").select("*").eq("user_id", userId),
    supabase.from("activation_rules").select("*").eq("user_id", userId).eq("enabled", true),
  ]);
  
  const contacts = (contactsRes.data || []) as Contact[];
  const documents = (documentsRes.data || []) as Document[];
  const typePermissions = (typePermissionsRes.data || []) as ContactTypePermission[];
  const activationRules = (activationRulesRes.data || []) as ActivationRule[];
  
  console.log(`Processing ${contacts.length} contacts, ${activationRules.length} activation rules for switch trigger`);
  
  const results: any[] = [];
  
  for (const contact of contacts) {
    if (!contact.email) {
      console.log(`Skipping contact ${contact.name} - no email`);
      continue;
    }
    
    // Determine permissions for this contact
    let permissions = contact.permissions || {};
    
    if (contact.use_type_defaults) {
      const typeDefault = typePermissions.find(
        (tp) => tp.contact_type === contact.contact_type
      );
      if (typeDefault) {
        permissions = { ...typeDefault.default_permissions, ...permissions };
      }
    }
    
    // Filter documents based on permissions
    const allowedDocuments = documents.filter((doc) => {
      const docTypeKey = `documents_${doc.document_type}`;
      return permissions[docTypeKey] === true;
    });
    
    // Get custom_message for this contact from activation rules
    const customMessage = getCustomMessageForContact(contact, activationRules);
    
    const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";
    
    const emailTemplate = profile ? {
      email_subject: profile.email_subject,
      email_header_title: profile.email_header_title,
      email_header_subtitle: profile.email_header_subtitle,
      email_intro_message: profile.email_intro_message,
      email_footer_message: profile.email_footer_message,
    } : {};
    
    // Generate portal access token for this contact
    const portalToken = await generatePortalToken(supabase, userId, contact.id);
    
    const notificationPayload = {
      notificationType: "switch_triggered",
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      contactType: contact.contact_type,
      userName: userName,
      emergencyInstructions: permissions.emergency_instructions ? profile?.emergency_instructions : null,
      customMessage: customMessage,
      documents: allowedDocuments,
      permissions,
      emailTemplate,
      portalToken,
      portalBaseUrl: supabaseUrl.replace('.supabase.co', '.supabase.co').replace('//', '//'),
    };
    
    console.log(`Sending to ${contact.name}: customMessage="${customMessage}", docs=${allowedDocuments.length}, portalToken=${portalToken ? 'generated' : 'none'}`);
    
    try {
      const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(notificationPayload),
      });
      
      const sendResult = await sendResponse.json();
      
      await supabase
        .from("sent_notifications")
        .insert({
          user_id: userId,
          contact_id: contact.id,
          notification_type: "switch_triggered",
          status: sendResult.success ? "sent" : "failed",
          error_message: sendResult.error || null,
        });
      
      results.push({
        contactId: contact.id,
        contactName: contact.name,
        success: sendResult.success,
        error: sendResult.error,
      });
      
      console.log(`Switch notification to ${contact.name}: ${sendResult.success ? "sent" : "failed"}`);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error sending to ${contact.name}:`, errMessage);
      results.push({
        contactId: contact.id,
        contactName: contact.name,
        success: false,
        error: errMessage,
      });
    }
  }
  
  return { success: true, results };
}

const handler = async (req: Request): Promise<Response> => {
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
      
      // Case 1: Grace period is active - check if it has ended
      if (settings.grace_period_active && settings.grace_period_end) {
        const graceEnd = new Date(settings.grace_period_end);
        
        if (now > graceEnd && !settings.switch_triggered) {
          console.log(`Grace period ended for user ${userId}, triggering switch`);
          const triggerResult = await triggerSwitch(supabase, supabaseUrl, supabaseServiceKey, settings, profile);
          results.switchTriggered.push({
            userId,
            ...triggerResult,
          });
        }
        continue;
      }
      
      // Case 2: Check if deadline has passed (start grace period)
      let deadline: Date | null = null;
      
      if (settings.deadline_mode === "frequency" && settings.next_check_in_due) {
        deadline = new Date(settings.next_check_in_due);
      } else if (settings.deadline_mode === "custom" && settings.custom_deadline) {
        deadline = new Date(settings.custom_deadline);
      }
      
      if (deadline && now > deadline && !settings.grace_period_active) {
        console.log(`Deadline passed for user ${userId}: ${deadline.toISOString()}`);
        const graceResult = await startGracePeriod(supabase, supabaseUrl, supabaseServiceKey, settings, profile);
        results.gracePeriodStarted.push({
          userId,
          ...graceResult,
        });
      }
    }
    
    console.log(`=== Results: ${results.gracePeriodStarted.length} grace periods started, ${results.switchTriggered.length} switches triggered ===`);
    
    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-deadlines:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
