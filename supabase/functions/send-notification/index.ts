import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

// ── Types ───────────────────────────────────────────────────

interface Document {
  id: string;
  title: string;
  content: string | null;
  document_type: string;
  description: string | null;
}

interface EmailTemplate {
  email_subject?: string;
  email_header_title?: string;
  email_header_subtitle?: string;
  email_intro_message?: string;
  email_footer_message?: string;
  email_grace_subject?: string;
  email_grace_intro?: string;
}

interface GracePeriodWarningRequest {
  notificationType: "grace_period_warning";
  recipientEmail: string;
  recipientName: string;
  userName: string;
  gracePeriodHours: number;
  graceEndDate: string;
  emailTemplate?: EmailTemplate;
  checkInUrl?: string | null;
}

interface SwitchTriggeredRequest {
  notificationType: "switch_triggered";
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactType: string;
  userName: string;
  emergencyInstructions: string | null;
  customMessage: string | null;
  documents: Document[];
  permissions: Record<string, boolean>;
  emailTemplate?: EmailTemplate;
  portalToken?: string | null;
  portalBaseUrl?: string;
}

interface LegacyNotificationRequest {
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactType: string;
  userName: string;
  emergencyInstructions: string | null;
  customMessage?: string | null;
  documents: Document[];
  permissions: Record<string, boolean>;
}

type NotificationRequest = GracePeriodWarningRequest | SwitchTriggeredRequest | LegacyNotificationRequest;

function formatDocumentType(type: string): string {
  return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

function resolveTemplate(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

function generateGracePeriodWarningHtml(data: GracePeriodWarningRequest): string {
  const { recipientName, gracePeriodHours, graceEndDate, userName, emailTemplate, checkInUrl } = data;
  const graceIntro = resolveTemplate(
    emailTemplate?.email_grace_intro || "Your Dead Man's Switch has detected that you did not check in by your scheduled deadline.",
    { userName }
  );
  const checkInButtonHtml = checkInUrl ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${checkInUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">✓ I'm alive — check in now</a>
          <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">Clicking this counts as your check-in. This link expires in 7 days.</p>
        </div>` : '';
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">⚠️ Grace Period Started</h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">Dead Man's Switch Warning</p>
      </div>
      <div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin: 0 0 20px 0;">Hello <strong>${recipientName}</strong>,</p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 15px; font-weight: 600;">You missed your scheduled check-in!</p>
        </div>
        <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${graceIntro} A <strong>${gracePeriodHours}-hour grace period</strong> has now started.</p>
        <div style="background-color: #fee2e2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="color: #991b1b; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">⏰ GRACE PERIOD ENDS:</p>
          <p style="color: #dc2626; margin: 0; font-size: 18px; font-weight: 700;">${formatDateTime(graceEndDate)}</p>
        </div>
        ${checkInButtonHtml}
        <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;"><strong>What happens next?</strong><br>If you do not perform a check-in before the grace period ends, your emergency contacts will be automatically notified with the information you have configured.</p>
        <div style="text-align: center; margin: 32px 0;"><p style="font-size: 16px; color: #059669; font-weight: 600; margin: 0;">✅ Log in to your account and perform a check-in to cancel this alert.</p></div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">This is an automated message from your Dead Man's Switch system.<br>If you did not set up this system, please ignore this email.</p>
      </div>
    </body></html>`;
}

function generateSwitchTriggeredHtml(data: SwitchTriggeredRequest | LegacyNotificationRequest): string {
  const contactName = "contactName" in data ? data.contactName : "";
  const userName = data.userName;
  const emergencyInstructions = data.emergencyInstructions;
  const customMessage = data.customMessage || null;
  const documents = data.documents;
  const permissions = data.permissions;
  const emailTemplate: EmailTemplate = ("emailTemplate" in data && data.emailTemplate) ? data.emailTemplate : {};
  const portalToken = ("portalToken" in data) ? data.portalToken : null;
  const portalBaseUrl = ("portalBaseUrl" in data) ? data.portalBaseUrl : null;

  const headerTitle = emailTemplate.email_header_title || "🚨 Important Notification";
  const headerSubtitle = emailTemplate.email_header_subtitle || "Dead Man's Switch Activated";
  const introMessage = resolveTemplate(
    emailTemplate.email_intro_message || "This is an automated message from {userName}'s Dead Man's Switch system. The system has been activated because they have not checked in within their specified timeframe, and the grace period has now expired.",
    { userName }
  );
  const footerMessage = emailTemplate.email_footer_message || "This is an automated message from the Dead Man's Switch system. Please keep this information confidential and use it responsibly.";

  let sectionsHtml = "";

  if (customMessage) {
    sectionsHtml += `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;"><h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">💬 Personal Message from ${userName}</h3><div style="color: #1e3a5f; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${customMessage}</div></div>`;
  }

  if (emergencyInstructions && permissions.emergency_instructions) {
    sectionsHtml += `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;"><h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">⚠️ Emergency Instructions</h3><div style="color: #78350f; font-size: 14px; line-height: 1.6;">${emergencyInstructions}</div></div>`;
  }

  const documentsByType: Record<string, Document[]> = {};
  for (const doc of documents) {
    if (!documentsByType[doc.document_type]) documentsByType[doc.document_type] = [];
    documentsByType[doc.document_type].push(doc);
  }

  for (const [docType, docs] of Object.entries(documentsByType)) {
    sectionsHtml += `<div style="margin: 24px 0;"><h3 style="color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;">📄 ${formatDocumentType(docType)}</h3>`;
    for (const doc of docs) {
      sectionsHtml += `<div style="background-color: #f9fafb; padding: 16px; margin: 12px 0; border-radius: 8px; border: 1px solid #e5e7eb;"><h4 style="color: #111827; margin: 0 0 8px 0; font-size: 15px;">${doc.title}</h4>${doc.description ? `<p style="color: #6b7280; font-size: 13px; margin: 0 0 12px 0;">${doc.description}</p>` : ""}${doc.content ? `<div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${doc.content}</div>` : ""}</div>`;
    }
    sectionsHtml += `</div>`;
  }

  let portalHtml = "";
  if (portalToken) {
    const portalUrl = `${portalBaseUrl || ""}/portal/${portalToken}`;
    const ackUrl = `${portalBaseUrl || ""}/portal/${portalToken}/acknowledge`;
    portalHtml = `<div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;"><h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px;">🔐 Access Your Document Portal</h3><p style="color: #047857; margin: 0 0 16px 0; font-size: 14px;">You can also view your authorized documents online at any time using the secure link below:</p><a href="${portalUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Document Portal →</a><p style="color: #6b7280; margin: 12px 0 0 0; font-size: 12px;">This link is private and unique to you. Do not share it with others.</p></div><div style="text-align: center; margin: 16px 0;"><a href="${ackUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">✓ Confirm I have received this message</a><p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 11px;">Clicking this lets the system know you have seen this notification.</p></div>`;
  } else {
    portalHtml += `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;"><p style="color: #92400e; margin: 0; font-size: 13px;">Your portal link was not included in this notification. Please contact the sender.</p></div>`;
  }

  if (!sectionsHtml) {
    sectionsHtml = `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; text-align: center; border-radius: 8px; margin: 20px 0;"><p style="color: #15803d; margin: 0; font-weight: 600;">All your personalised content and documents are available securely in your portal.</p><p style="color: #6b7280; margin: 8px 0 0 0; font-size: 13px;">Use the secure access link below to view everything ${userName} has prepared for you.</p></div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="margin: 0; font-size: 24px; font-weight: 600;">${headerTitle}</h1><p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">${headerSubtitle}</p></div><div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;"><p style="font-size: 16px; margin: 0 0 20px 0;">Dear <strong>${contactName}</strong>,</p><p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${introMessage}</p><p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${userName} has designated you as a trusted contact and has authorized the following information to be shared with you:</p>${sectionsHtml}${portalHtml}<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;"><p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">${footerMessage}</p></div></body></html>`;
}

function buildWelcomeHtml(userEmail: string, appUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1A9BD7 0%, #0D6EA8 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to LegacyVault</h1>
      <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">Your digital legacy is now protected</p>
    </div>
    <div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">Hi <strong>${userEmail}</strong>,</p>
      <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">Your LegacyVault account is ready. Here's how to get started:</p>
      <ol style="padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 2;">
        <li><strong>Add a trusted contact</strong> — someone who will receive your information</li>
        <li><strong>Configure your switch</strong> — set your check-in frequency</li>
        <li><strong>Add your documents and accounts</strong> — store what matters</li>
        <li><strong>Generate a portal link</strong> — give your contact access</li>
        <li><strong>Send yourself a test email</strong> — verify everything works</li>
      </ol>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #1A9BD7; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Go to your vault →</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-size: 13px;">⚠️ Remember: your password is your encryption key. If you lose it, your data cannot be recovered. Store it in a password manager or write it down somewhere safe.</p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 24px 0 0 0;">LegacyVault · <a href="${appUrl}/terms" style="color: #9ca3af;">Terms</a> · <a href="${appUrl}/privacy" style="color: #9ca3af;">Privacy</a></p>
    </div>
  </body></html>`;
}

function buildPortalAccessedHtml(contactName: string, accessedAt: string): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#1A9BD7,#0D6EA8);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:22px">👁 Portal Accessed</h1>
    <p style="margin:8px 0 0;opacity:.9;font-size:14px">LegacyVault Notification</p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <p style="color:#374151"><strong>${contactName}</strong> has accessed their portal.</p>
    <p style="color:#6b7280;font-size:14px">Access time: ${accessedAt} UTC</p>
    <p style="color:#6b7280;font-size:13px">If you are still alive and did not expect this, your switch may have been triggered accidentally. Log in to your vault to check your system status and reset if needed.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="font-size:12px;color:#9ca3af;text-align:center">This is an automated notification from LegacyVault.</p>
  </div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    const notificationType = "notificationType" in data ? data.notificationType : "switch_triggered";

    let emailHtml: string;
    let recipientEmail: string;
    let recipientName: string;
    let subject: string;

    if (notificationType === "portal_accessed") {
      const { recipientEmail: pEmail, recipientName: pName, contactName, accessedAt, userId, contactId } = data as any;
      emailHtml = buildPortalAccessedHtml(contactName || 'A trusted contact', accessedAt || new Date().toISOString());
      recipientEmail = pEmail;
      recipientName = pName || 'Vault Owner';
      subject = `👁 ${contactName || 'A contact'} has accessed their portal`;
      console.log(`Sending portal accessed notification to ${recipientEmail}`);

      // Record in sent_notifications
      if (userId && contactId) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.58.0");
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase.from('sent_notifications').insert({
            user_id: userId,
            contact_id: contactId,
            notification_type: 'portal_accessed',
            status: 'sent',
          });
        } catch (e) {
          console.error('Failed to record portal_accessed notification:', e);
        }
      }
    } else if (notificationType === "grace_period_warning") {
      const warningData = data as any;
      const isPreDeadline = warningData.isPreDeadlineReminder === true;
      if (isPreDeadline) {
        const checkInUrl = warningData.checkInUrl || '#';
        const hoursLabel = warningData.gracePeriodHours || '48 hours';
        subject = `⏰ Reminder: Your LegacyVault check-in is due in ${hoursLabel}`;
        emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #1A9BD7 0%, #0D6EA8 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="margin: 0; font-size: 24px; font-weight: 600;">⏰ Check-in Reminder</h1><p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">Your deadline is approaching</p></div><div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;"><p style="font-size: 16px; margin: 0 0 20px 0;">Hello,</p><p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">This is a reminder that your Dead Man's Switch check-in deadline is approaching. Please check in within <strong>${hoursLabel}</strong> to prevent your switch from activating.</p><div style="text-align: center; margin: 32px 0;"><a href="${checkInUrl}" style="display: inline-block; background-color: #1A9BD7; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Check In Now →</a></div><p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0 0; text-align: center;">If you do not check in before the deadline, a grace period will start, followed by automatic notification of your contacts.</p></div></body></html>`;
      } else {
        emailHtml = generateGracePeriodWarningHtml(warningData as GracePeriodWarningRequest);
        subject = warningData.emailTemplate?.email_grace_subject || "⚠️ Grace Period Started - Check In Required";
      }
      recipientEmail = warningData.recipientEmail;
      recipientName = warningData.recipientName;
      console.log(`Sending ${isPreDeadline ? 'pre-deadline reminder' : 'grace period warning'} to ${recipientName} (${recipientEmail})`);
    } else if (notificationType === "plan_expiry_warning") {
      const { recipientEmail: peEmail, planLabel, daysLabel, expiresAt, appUrl } = data as any;
      const expiryDate = new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#374151;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;font-weight:600;">Your LegacyVault plan expires ${daysLabel}</h1>
          <p style="margin:12px 0 0;opacity:.9;font-size:14px;">Plan Expiry Notice</p>
        </div>
        <div style="background-color:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
          <p style="font-size:15px;margin:0 0 20px;color:#4b5563;">Your <strong>${planLabel || 'paid'}</strong> plan expires on <strong>${expiryDate}</strong>.</p>
          <p style="font-size:15px;margin:0 0 24px;color:#4b5563;">After expiry, your account will revert to the Free plan. Your data will remain intact but some features will be restricted.</p>
          <div style="text-align:center;margin:32px 0;"><a href="${appUrl || ''}/settings?tab=account" style="display:inline-block;background-color:#f59e0b;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Renew your plan →</a></div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;">LegacyVault · <a href="${appUrl || ''}/privacy" style="color:#9ca3af;">Privacy</a></p>
        </div>
      </body></html>`;
      recipientEmail = peEmail;
      recipientName = peEmail;
      subject = `Your LegacyVault ${planLabel || 'paid'} plan expires ${daysLabel || 'soon'}`;
      console.log(`Sending plan expiry warning to ${recipientEmail}`);
    } else if (notificationType === "welcome") {
      const { recipientEmail: wEmail, appUrl } = data as any;
      emailHtml = buildWelcomeHtml(wEmail, appUrl || 'https://legacy-guard-safehold-48855.lovable.app');
      recipientEmail = wEmail;
      recipientName = wEmail;
      subject = 'Welcome to LegacyVault — get started in 5 steps';
      console.log(`Sending welcome email to ${recipientEmail}`);
    } else if (notificationType === "account_deleted") {
      const { recipientEmail: dEmail, deletedBy } = data as any;
      const isAdmin = deletedBy === 'admin';
      recipientEmail = dEmail;
      recipientName = dEmail;
      subject = 'Your LegacyVault account has been deleted';
      emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#374151;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;font-weight:600;">Account Deleted</h1>
          <p style="margin:12px 0 0;opacity:.9;font-size:14px;">LegacyVault</p>
        </div>
        <div style="background-color:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;margin:0 0 20px;">Hello,</p>
          <p style="font-size:15px;margin:0 0 24px;color:#4b5563;">Your LegacyVault account (<strong>${dEmail}</strong>) has been permanently deleted${isAdmin ? ' by an administrator' : ''}.</p>
          <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:20px 0;border-radius:4px;">
            <p style="color:#991b1b;margin:0;font-size:14px;font-weight:600;">What this means:</p>
            <ul style="color:#991b1b;margin:8px 0 0;padding-left:20px;font-size:14px;">
              <li>All your stored data has been permanently erased</li>
              <li>Your encrypted vault and documents have been removed</li>
              <li>Your emergency contacts will no longer be notified</li>
              <li>Any active Dead Man's Switch has been deactivated</li>
            </ul>
          </div>
          <p style="font-size:15px;margin:0 0 24px;color:#4b5563;">If you did not request this deletion${isAdmin ? '' : ' or believe this was done in error'}, please contact support immediately.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;">LegacyVault · This is an automated message.</p>
        </div>
      </body></html>`;
      console.log(`Sending account deletion email to ${recipientEmail} (deleted by: ${deletedBy})`);
    } else {
      const triggerData = data as SwitchTriggeredRequest | LegacyNotificationRequest;
      emailHtml = generateSwitchTriggeredHtml(triggerData);
      recipientEmail = triggerData.contactEmail;
      recipientName = triggerData.contactName;
      const emailTemplate: EmailTemplate = ("emailTemplate" in triggerData && triggerData.emailTemplate) ? triggerData.emailTemplate : {};
      subject = resolveTemplate(
        emailTemplate.email_subject || `🚨 Important: Message from {userName}'s Dead Man's Switch`,
        { userName: triggerData.userName }
      );
      console.log(`Sending switch triggered notification to ${recipientName} (${recipientEmail}), customMessage: ${triggerData.customMessage || "none"}`);
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured in Edge Function secrets');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured — RESEND_API_KEY missing. Set this in Supabase Edge Function secrets.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Dead Man's Switch <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
