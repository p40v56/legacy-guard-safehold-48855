import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mail, Eye, EyeOff, Save, Info, Send, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/ui/rich-text-editor';

export interface EmailTemplateData {
  email_subject: string;
  email_header_title: string;
  email_header_subtitle: string;
  email_intro_message: string;
  email_footer_message: string;
  email_grace_subject: string;
  email_grace_intro: string;
}

interface EmailTemplateEditorProps {
  template: EmailTemplateData;
  onChange: (template: EmailTemplateData) => void;
  onSave: () => void;
  saving: boolean;
  userName?: string;
}

const VARIABLES_HELP = [
  { name: '{userName}', description: "Your full name" },
  { name: '{contactName}', description: "Recipient contact's name" },
  { name: '{triggerDate}', description: 'Date the switch was triggered' },
  { name: '{gracePeriodHours}', description: 'Duration of the grace period' },
];

const VariablesInset = () => (
  <div className="mt-2 p-2 bg-muted/50 rounded-lg">
    <p className="text-xs text-muted-foreground font-medium mb-1">Available variables:</p>
    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
      {VARIABLES_HELP.map(v => (
        <span key={v.name} className="text-xs text-muted-foreground">
          <code className="bg-muted px-1 rounded text-foreground">{v.name}</code>{' '}
          <em>{v.description}</em>
        </span>
      ))}
    </div>
  </div>
);

function resolveVars(text: string, userName: string): string {
  return text
    .replace(/\{userName\}/g, userName)
    .replace(/\{contactName\}/g, 'Contact Name')
    .replace(/\{triggerDate\}/g, new Date().toLocaleDateString())
    .replace(/\{gracePeriodHours\}/g, '24');
}

/** Builds a real HTML email preview matching send-notification edge function output */
function buildGracePreviewHtml(template: EmailTemplateData, userName: string): string {
  const graceIntro = resolveVars(
    template.email_grace_intro || "Your Dead Man's Switch has detected that you did not check in by your scheduled deadline.",
    userName
  );
  const graceEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">⚠️ Grace Period Started</h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">Dead Man's Switch Warning</p>
      </div>
      <div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin: 0 0 20px 0;">Hello <strong>${userName}</strong>,</p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 15px; font-weight: 600;">You missed your scheduled check-in!</p>
        </div>
        <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${graceIntro} A <strong>24-hour grace period</strong> has now started.</p>
        <div style="background-color: #fee2e2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="color: #991b1b; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">⏰ GRACE PERIOD ENDS:</p>
          <p style="color: #dc2626; margin: 0; font-size: 18px; font-weight: 700;">${graceEnd}</p>
        </div>
        <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;"><strong>What happens next?</strong><br>If you do not perform a check-in before the grace period ends, your emergency contacts will be automatically notified with the information you have configured.</p>
        <div style="text-align: center; margin: 32px 0;"><p style="font-size: 16px; color: #059669; font-weight: 600; margin: 0;">✅ Log in to your account and perform a check-in to cancel this alert.</p></div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">This is an automated message from your Dead Man's Switch system.<br>If you did not set up this system, please ignore this email.</p>
      </div>
    </div>`;
}

function buildTriggeredPreviewHtml(template: EmailTemplateData, userName: string): string {
  const headerTitle = template.email_header_title || '🚨 Important Notification';
  const headerSubtitle = template.email_header_subtitle || "Dead Man's Switch Activated";
  const introMessage = resolveVars(
    template.email_intro_message || "This is an automated message from {userName}'s Dead Man's Switch system.",
    userName
  );
  const footerMessage = template.email_footer_message || "This is an automated message from the Dead Man's Switch system.";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${headerTitle}</h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 14px;">${headerSubtitle}</p>
      </div>
      <div style="background-color: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin: 0 0 20px 0;">Dear <strong>Contact Name</strong>,</p>
        <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${introMessage}</p>
        <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563;">${userName} has designated you as a trusted contact and has authorized the following information to be shared with you:</p>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">⚠️ Emergency Instructions</h3>
          <div style="color: #78350f; font-size: 14px; line-height: 1.6;">Your emergency instructions will appear here based on your profile settings.</div>
        </div>

        <div style="margin: 24px 0;">
          <h3 style="color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;">📄 Documents</h3>
          <div style="background-color: #f9fafb; padding: 16px; margin: 12px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="color: #111827; margin: 0 0 8px 0; font-size: 15px;">Sample Document Title</h4>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">Documents shared based on this contact's permissions will appear here.</p>
          </div>
        </div>

        <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px;">🔐 Access Your Document Portal</h3>
          <p style="color: #047857; margin: 0 0 16px 0; font-size: 14px;">You can also view your authorized documents online at any time using the secure link below:</p>
          <span style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Open Document Portal →</span>
          <p style="color: #6b7280; margin: 12px 0 0 0; font-size: 12px;">This link is private and unique to you. Do not share it with others.</p>
        </div>

        <div style="text-align: center; margin: 16px 0;">
          <span style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px;">✓ Confirm I have received this message</span>
          <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 11px;">Clicking this lets the system know you have seen this notification.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <div style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">${footerMessage}</div>
      </div>
    </div>`;
}

const EmailTemplateEditor = ({ template, onChange, onSave, saving, userName = 'John' }: EmailTemplateEditorProps) => {
  const [showGracePreview, setShowGracePreview] = useState(false);
  const [showTriggeredPreview, setShowTriggeredPreview] = useState(false);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const { toast } = useToast();

  const updateField = (field: keyof EmailTemplateData, value: string) => {
    onChange({ ...template, [field]: value });
  };

  const gracePreviewHtml = useMemo(() => buildGracePreviewHtml(template, userName), [template, userName]);
  const triggeredPreviewHtml = useMemo(() => buildTriggeredPreviewHtml(template, userName), [template, userName]);

  const sendTestEmail = async (templateType: 'switch_triggered' | 'grace_period') => {
    setSendingTest(templateType);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('send-test-email', {
        body: { templateType },
      });

      if (response.error) throw new Error(response.error.message);

      toast({ title: "Test email sent ✉️", description: "Check your inbox for the test email." });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      const msg = error.message || "Failed to send test email";
      const isResendLimit = msg.includes("only send testing emails");
      toast({
        title: isResendLimit ? "Resend free-tier limitation" : "Error",
        description: isResendLimit
          ? "On the free tier, test emails can only be sent to the Resend account owner's email. Verify a custom domain at resend.com/domains to send to any address."
          : msg,
        variant: "destructive",
      });
    } finally {
      setSendingTest(null);
    }
  };

  return (
    <div className="space-y-4 relative pb-20">
      {/* Grace Period Warning Email */}
      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-warning" />
                  Grace Period Warning Email
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-warning/30 text-warning">Sent to you</Badge>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </div>
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">This email is sent to you when the grace period begins after a missed check-in.</p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-5 pt-0">
              <div>
                <Label className="text-foreground">Email Subject</Label>
                <Input value={template.email_grace_subject} onChange={e => updateField('email_grace_subject', e.target.value)} placeholder="Grace period subject..." />
                <VariablesInset />
              </div>
              <div>
                <Label className="text-foreground">Introduction Message</Label>
                <RichTextEditor value={template.email_grace_intro} onChange={v => updateField('email_grace_intro', v)} placeholder="Grace period intro text..." className="[&_.ql-editor]:!min-h-[100px]" />
                <VariablesInset />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendTestEmail('grace_period')}
                  disabled={!!sendingTest}
                  className="rounded-xl"
                >
                  {sendingTest === 'grace_period' ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send test email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGracePreview(p => !p)}
                  className="rounded-xl"
                >
                  {showGracePreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showGracePreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>

              {showGracePreview && (
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="p-1">
                    <div className="text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-t-lg flex items-center justify-between">
                      <span>Subject: <strong className="text-foreground">{resolveVars(template.email_grace_subject, userName)}</strong></span>
                      <Badge variant="secondary" className="text-[10px]">Preview</Badge>
                    </div>
                    <div
                      className="bg-white rounded-b-lg"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(gracePreviewHtml) }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Switch Triggered Email */}
      <Collapsible defaultOpen={false}>
        <Card className="bg-muted/30 border-none rounded-2xl">
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="cursor-pointer">
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-destructive" />
                  Switch Triggered Email
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Sent to contacts</Badge>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </div>
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">This email is sent to your emergency contacts when the switch is triggered.</p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-5 pt-0">
              <div>
                <Label className="text-foreground">Email Subject</Label>
                <Input value={template.email_subject} onChange={e => updateField('email_subject', e.target.value)} placeholder="Email subject line..." />
                <VariablesInset />
              </div>
              <Separator className="bg-border/50" />
              <div>
                <Label className="text-foreground">Header Title</Label>
                <Input value={template.email_header_title} onChange={e => updateField('email_header_title', e.target.value)} placeholder="e.g. 🚨 Important Notification" />
              </div>
              <div>
                <Label className="text-foreground">Header Subtitle</Label>
                <Input value={template.email_header_subtitle} onChange={e => updateField('email_header_subtitle', e.target.value)} placeholder="e.g. Dead Man's Switch Activated" />
              </div>
              <Separator className="bg-border/50" />
              <div>
                <Label className="text-foreground">Introduction Message</Label>
                <RichTextEditor value={template.email_intro_message} onChange={v => updateField('email_intro_message', v)} placeholder="Main introduction message..." className="[&_.ql-editor]:!min-h-[100px]" />
                <VariablesInset />
              </div>
              <div>
                <Label className="text-foreground">Footer Message</Label>
                <RichTextEditor value={template.email_footer_message} onChange={v => updateField('email_footer_message', v)} placeholder="Footer text..." className="[&_.ql-editor]:!min-h-[100px]" />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendTestEmail('switch_triggered')}
                  disabled={!!sendingTest}
                  className="rounded-xl"
                >
                  {sendingTest === 'switch_triggered' ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send test email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTriggeredPreview(p => !p)}
                  className="rounded-xl"
                >
                  {showTriggeredPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showTriggeredPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>

              {showTriggeredPreview && (
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="p-1">
                    <div className="text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-t-lg flex items-center justify-between">
                      <span>Subject: <strong className="text-foreground">{resolveVars(template.email_subject, userName)}</strong></span>
                      <Badge variant="secondary" className="text-[10px]">Preview</Badge>
                    </div>
                    <div
                      className="bg-white rounded-b-lg"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(triggeredPreviewHtml) }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Info box */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong className="text-foreground">How it works:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>The <strong>Emergency Instructions</strong> from your Profile are included automatically</li>
            <li>The <strong>Custom Message</strong> per rule is added from your Activation Rules</li>
            <li><strong>Documents</strong> are shared based on each contact's permissions</li>
            <li>Use variables listed below each field to insert dynamic content</li>
          </ul>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border py-4 -mx-1 px-1 z-10">
        <Button onClick={onSave} disabled={saving} variant="default" className="w-full sm:w-auto">
          {saving ? (<><LoadingSpinner size="sm" className="mr-2" />Saving...</>) : (<><Save className="w-4 h-4 mr-2" />Save Email Templates</>)}
        </Button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
