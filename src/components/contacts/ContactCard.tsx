
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, Phone, Mail, Shield, AlertCircle, MessageSquare, Link2, Check } from 'lucide-react';
import PermissionsConfig from '@/components/contacts/PermissionsConfig';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/hooks/usePlan';
import { Lock } from 'lucide-react';

interface ContactCardProps {
  contact: EmergencyContact;
  contactTypeLabels: Record<ContactType, string>;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (contactId: string) => void;
  onPermissionsChange: (contactId: string, permissions: ContactPermissions) => void;
  onUseTypeDefaultsChange: (contactId: string, useDefaults: boolean) => void;
  onCustomMessageChange?: (contactId: string, message: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  contactTypeLabels,
  onEdit,
  onDelete,
  onPermissionsChange,
  onUseTypeDefaultsChange,
  onCustomMessageChange
}) => {
  const { toast } = useToast();
  const { plan } = usePlan();
  const isFree = plan === 'free';
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [customMsg, setCustomMsg] = useState(contact.custom_message || '');
  const [savingMessage, setSavingMessage] = useState(false);

  const handleGeneratePortalLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/contact-portal?action=generate-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ contactId: contact.id }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      const link = `${window.location.origin}/portal/${result.token}`;
      setPortalLink(link);
      await navigator.clipboard.writeText(link);
      toast({
        title: "Portal link generated & copied!",
        description: "The link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error generating portal link:', error);
      toast({
        title: "Error",
        description: "Failed to generate portal link",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSaveCustomMessage = async () => {
    setSavingMessage(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ custom_message: customMsg || null })
        .eq('id', contact.id);
      
      if (error) throw error;
      
      toast({
        title: "Message saved",
        description: "Custom message updated for this contact.",
      });
    } catch (error) {
      console.error('Error saving custom message:', error);
      toast({
        title: "Error",
        description: "Failed to save custom message",
        variant: "destructive",
      });
    } finally {
      setSavingMessage(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{contact.name}</h3>
            <p className="text-muted-foreground">{contactTypeLabels[contact.contact_type]}</p>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            <Badge variant="secondary">Priority: {contact.priority_order}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(contact)}
              className="text-primary hover:text-primary/80"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(contact.id)}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/20 border-border">
            <TabsTrigger value="permissions" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="message" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <AlertCircle className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>
          <TabsContent value="permissions" className="space-y-4 mt-4">
            <PermissionsConfig
              permissions={contact.permissions}
              onChange={(permissions) => onPermissionsChange(contact.id, permissions)}
              useTypeDefaults={contact.use_type_defaults}
              onUseTypeDefaultsChange={(useDefaults) => onUseTypeDefaultsChange(contact.id, useDefaults)}
            />
          </TabsContent>
          <TabsContent value="message" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Personal Message for {contact.name}</Label>
              <p className="text-muted-foreground text-sm">
                This message will be included in the email sent to this contact when the switch triggers.
              </p>
              <Textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder={`Write a personal message for ${contact.name}...`}
                className="min-h-[120px] bg-muted/30 border-border rounded-xl"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveCustomMessage}
                  disabled={savingMessage}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 rounded-xl"
                >
                  {savingMessage ? 'Saving...' : 'Save Message'}
                </Button>
                {isFree ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Portal links require a paid plan</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleGeneratePortalLink}
                    disabled={generatingLink}
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {generatingLink ? 'Generating...' : portalLink ? 'Regenerate Portal Link' : 'Generate Portal Link'}
                  </Button>
                )}
              </div>
              {!isFree && portalLink && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-primary truncate flex-1">{portalLink}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(portalLink);
                      toast({ title: "Copied!", description: "Portal link copied to clipboard." });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-foreground">Relationship:</Label>
                <span className="text-muted-foreground">{contact.relationship}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-foreground">Can Receive Messages:</Label>
                <span className="text-muted-foreground">{contact.can_receive_messages ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-foreground">Created At:</Label>
                <span className="text-muted-foreground">{new Date(contact.created_at).toLocaleString()}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContactCard;
