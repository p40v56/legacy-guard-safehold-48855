import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Eye, EyeOff, Save, Info, Send } from 'lucide-react';
import { useState } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const EmailTemplateEditor = ({ template, onChange, onSave, saving, userName = 'John' }: EmailTemplateEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'switch_triggered' | 'grace_period'>('switch_triggered');
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const { toast } = useToast();

  const updateField = (field: keyof EmailTemplateData, value: string) => {
    onChange({ ...template, [field]: value });
  };

  const resolveVariable = (text: string) => {
    return text.replace(/\{userName\}/g, userName).replace(/\{contactName\}/g, 'Contact Name').replace(/\{triggerDate\}/g, new Date().toLocaleDateString()).replace(/\{gracePeriodHours\}/g, '24');
  };

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
    <div className="space-y-6">
      {/* Switch Triggered Email */}
      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2 text-destructive" />
              Switch Triggered Email
            </div>
            <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Sent to contacts</Badge>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">This email is sent to your emergency contacts when the switch is triggered.</p>
        </CardHeader>
        <CardContent className="space-y-5">
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
            <Textarea value={template.email_intro_message} onChange={e => updateField('email_intro_message', e.target.value)} placeholder="Main introduction message..." rows={4} className="resize-none" />
            <VariablesInset />
          </div>
          <div>
            <Label className="text-foreground">Footer Message</Label>
            <Textarea value={template.email_footer_message} onChange={e => updateField('email_footer_message', e.target.value)} placeholder="Footer text..." rows={2} className="resize-none" />
          </div>
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
        </CardContent>
      </Card>

      {/* Grace Period Warning Email */}
      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-2 text-warning" />
              Grace Period Warning Email
            </div>
            <Badge variant="outline" className="text-xs border-warning/30 text-warning">Sent to you</Badge>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">This email is sent to you when the grace period begins after a missed check-in.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-foreground">Email Subject</Label>
            <Input value={template.email_grace_subject} onChange={e => updateField('email_grace_subject', e.target.value)} placeholder="Grace period subject..." />
            <VariablesInset />
          </div>
          <div>
            <Label className="text-foreground">Introduction Message</Label>
            <Textarea value={template.email_grace_intro} onChange={e => updateField('email_grace_intro', e.target.value)} placeholder="Grace period intro text..." rows={3} className="resize-none" />
            <VariablesInset />
          </div>
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
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-muted/30 border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-primary" />
              Email Preview
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="rounded-xl">
              {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </CardTitle>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-destructive p-6 text-center">
                <h2 className="text-xl font-semibold text-destructive-foreground">{template.email_header_title}</h2>
                <p className="text-destructive-foreground/80 text-sm mt-1">{template.email_header_subtitle}</p>
              </div>
              <div className="bg-card p-6 space-y-4">
                <p className="text-foreground">Dear <strong>Contact Name</strong>,</p>
                <p className="text-muted-foreground text-sm">{resolveVariable(template.email_intro_message)}</p>
                <div className="bg-warning/10 border-l-4 border-warning p-4 rounded">
                  <h3 className="text-warning font-medium text-sm">⚠️ Emergency Instructions</h3>
                  <p className="text-muted-foreground text-xs mt-1">Your emergency instructions will appear here...</p>
                </div>
                <div className="bg-muted/50 p-4 rounded">
                  <h3 className="text-foreground font-medium text-sm">📄 Documents</h3>
                  <p className="text-muted-foreground text-xs mt-1">Shared documents will appear here...</p>
                </div>
                <hr className="border-border" />
                <p className="text-muted-foreground text-xs text-center">{template.email_footer_message}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

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

      {/* Save Button */}
      <Button onClick={onSave} disabled={saving} variant="default" className="w-full sm:w-auto">
        {saving ? (<><LoadingSpinner size="sm" className="mr-2" />Saving...</>) : (<><Save className="w-4 h-4 mr-2" />Save Email Templates</>)}
      </Button>
    </div>
  );
};

export default EmailTemplateEditor;
