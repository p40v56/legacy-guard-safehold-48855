import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSettings {
  user_id: string;
  is_active: boolean;
  deadline_mode: string;
  next_check_in_due: string | null;
  custom_deadline: string | null;
  grace_period_hours: number;
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
}

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  emergency_instructions: string | null;
}

interface Document {
  id: string;
  title: string;
  content: string | null;
  document_type: string;
  description: string | null;
}

interface ContactTypePermission {
  contact_type: string;
  default_permissions: Record<string, boolean>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking for expired deadlines...");
    
    const now = new Date();
    
    // Get all active user settings where deadline has passed
    const { data: activeSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("is_active", true);
    
    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }
    
    console.log(`Found ${activeSettings?.length || 0} active users`);
    
    const expiredUsers: UserSettings[] = [];
    
    for (const settings of activeSettings || []) {
      let deadline: Date | null = null;
      
      if (settings.deadline_mode === "frequency" && settings.next_check_in_due) {
        deadline = new Date(settings.next_check_in_due);
      } else if (settings.deadline_mode === "custom" && settings.custom_deadline) {
        deadline = new Date(settings.custom_deadline);
      }
      
      if (deadline) {
        // Add grace period
        const deadlineWithGrace = new Date(deadline.getTime() + (settings.grace_period_hours * 60 * 60 * 1000));
        
        if (now > deadlineWithGrace) {
          console.log(`User ${settings.user_id} deadline expired: ${deadline.toISOString()}`);
          expiredUsers.push(settings);
        }
      }
    }
    
    console.log(`Found ${expiredUsers.length} users with expired deadlines`);
    
    const results = [];
    
    for (const userSettings of expiredUsers) {
      const userId = userSettings.user_id;
      
      // Check if we already sent notifications for this user recently (within last 24 hours)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { data: recentNotifications } = await supabase
        .from("sent_notifications")
        .select("id")
        .eq("user_id", userId)
        .gte("sent_at", twentyFourHoursAgo.toISOString())
        .limit(1);
      
      if (recentNotifications && recentNotifications.length > 0) {
        console.log(`Skipping user ${userId} - notifications already sent recently`);
        continue;
      }
      
      // Get user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      // Get user's contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .eq("can_receive_messages", true);
      
      // Get user's documents
      const { data: documents } = await supabase
        .from("legacy_documents")
        .select("*")
        .eq("user_id", userId);
      
      // Get user's contact type permissions
      const { data: typePermissions } = await supabase
        .from("contact_type_permissions")
        .select("*")
        .eq("user_id", userId);
      
      console.log(`Processing ${contacts?.length || 0} contacts for user ${userId}`);
      
      for (const contact of contacts || []) {
        if (!contact.email) {
          console.log(`Skipping contact ${contact.name} - no email`);
          continue;
        }
        
        // Determine permissions for this contact
        let permissions = contact.permissions || {};
        
        if (contact.use_type_defaults) {
          const typeDefault = typePermissions?.find(
            (tp: ContactTypePermission) => tp.contact_type === contact.contact_type
          );
          if (typeDefault) {
            permissions = { ...typeDefault.default_permissions, ...permissions };
          }
        }
        
        // Filter documents based on permissions
        const allowedDocuments = (documents || []).filter((doc: Document) => {
          const docTypeKey = `documents_${doc.document_type}`;
          return permissions[docTypeKey] === true;
        });
        
        // Call send-notification edge function
        const notificationPayload = {
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          contactType: contact.contact_type,
          userName: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User",
          emergencyInstructions: permissions.emergency_instructions ? profile?.emergency_instructions : null,
          documents: allowedDocuments,
          permissions,
        };
        
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
          
          // Record the notification
          await supabase
            .from("sent_notifications")
            .insert({
              user_id: userId,
              contact_id: contact.id,
              notification_type: "deadline_expired",
              status: sendResult.success ? "sent" : "failed",
              error_message: sendResult.error || null,
            });
          
          results.push({
            contactId: contact.id,
            contactName: contact.name,
            success: sendResult.success,
            error: sendResult.error,
          });
          
          console.log(`Notification to ${contact.name}: ${sendResult.success ? "sent" : "failed"}`);
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
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: expiredUsers.length,
        results,
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
