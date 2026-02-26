import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, Phone, Mail, Shield, AlertCircle, MessageSquare, Link2, Check, ChevronDown, Eye } from 'lucide-react';
import PermissionsConfig from '@/components/contacts/PermissionsConfig';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/hooks/usePlan';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields } from '@/lib/crypto';
import { createPortalShares } from '@/lib/portalShares';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Lock } from 'lucide-react';
import { formatDateEU } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';

interface ContactCardProps {
  contact: EmergencyContact;
  contactTypeLabels: Record<ContactType, string>;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (contactId: string) => void;
  onPermissionsChange: (contactId: string, permissions: ContactPermissions) => void;
  onUseTypeDefaultsChange: (contactId: string, useDefaults: boolean) => void;
  onCustomMessageChange?: (contactId: string, message: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  contactTypeLabels,
  onEdit,
  onDelete,
  onPermissionsChange,
  onUseTypeDefaultsChange,
  onCustomMessageChange,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { toast } = useToast();
  const { plan } = usePlan();
  const { user } = useAuth();
  const { vaultKey } = useEncryption();
  const isFree = plan === 'free';
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [previewingPortal, setPreviewingPortal] = useState(false);
  const [customMsg, setCustomMsg] = useState(contact.custom_message || '');
  const [savingMessage, setSavingMessage] = useState(false);

  const generateTokenAndShares = async (): Promise<string | null> => {
    // Step 1: get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
    if (!session) throw new Error('No active session — please log out and log back in');

    // Step 2: vault check
    if (!vaultKey || !user) {
      toast({ title: 'Vault locked', description: 'Unlock your vault before generating portal links.', variant: 'destructive' });
      return null;
    }

    // Step 3: generate token from edge function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let response: Response;
    try {
      response = await fetch(
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
    } catch (fetchErr: any) {
      throw new Error(`Network error calling edge function: ${fetchErr.message}`);
    }

    let result: any;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Edge function returned non-JSON response (status ${response.status})`);
    }

    if (!response.ok) {
      throw new Error(`Edge function error (${response.status}): ${result?.error || JSON.stringify(result)}`);
    }

    if (!result.token) {
      throw new Error(`Edge function returned no token: ${JSON.stringify(result)}`);
    }

    // Step 4: create portal shares
    try {
      await createPortalShares(user.id, contact.id, result.token, vaultKey);
    } catch (shareErr: any) {
      throw new Error(`Portal share creation failed: ${shareErr.message}`);
    }

    return result.token;
  };

  const handleGeneratePortalLink = async () => {
    setGeneratingLink(true);
    try {
      const token = await generateTokenAndShares();
      if (!token) return;
      const link = `${window.location.origin}/portal/${token}`;
      setPortalLink(link);
      await navigator.clipboard.writeText(link);
      toast({ title: "Portal link generated & copied!", description: "The link has been copied to your clipboard." });
    } catch (error) {
      console.error('Error generating portal link:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to generate portal link", variant: "destructive" });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handlePreviewPortal = async () => {
    setPreviewingPortal(true);
    try {
      const token = await generateTokenAndShares();
      if (!token) return;
      window.open(`${window.location.origin}/portal/${token}`, '_blank');
    } catch (error) {
      console.error('Error previewing portal:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to generate portal preview", variant: "destructive" });
    } finally {
      setPreviewingPortal(false);
    }
  };

  const handleSaveCustomMessage = async () => {
    setSavingMessage(true);
    try {
      let updateData: any = { custom_message: customMsg || null, custom_message_iv: null };
      if (vaultKey && customMsg) {
        const encrypted = await encryptFields({ custom_message: customMsg }, vaultKey);
        updateData = encrypted;
      }
      const { error } = await supabase.from('contacts').update(updateData).eq('id', contact.id);
      if (error) throw error;
      toast({ title: "Message saved", description: "Custom message updated for this contact." });
    } catch (error) {
      console.error('Error saving custom message:', error);
      toast({ title: "Error", description: "Failed to save custom message", variant: "destructive" });
    } finally {
      setSavingMessage(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-0">
        {/* Compact collapsed header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {contactTypeLabels[contact.contact_type]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              #{contact.priority_order}
            </Badge>
          </div>
          <div className="flex items-center gap-1 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-border px-4 pb-4 pt-2">
            <Tabs defaultValue={isFree ? "permissions" : "portal"} className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-4 bg-muted/20 border-border">
                <TabsTrigger value="permissions" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
                  <Shield className="w-4 h-4 mr-2" />Permissions
                </TabsTrigger>
                <TabsTrigger value="message" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
                  <MessageSquare className="w-4 h-4 mr-2" />Message
                </TabsTrigger>
                <TabsTrigger value="portal" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
                  <Link2 className="w-4 h-4 mr-2" />Portal
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
                  <AlertCircle className="w-4 h-4 mr-2" />Details
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
                  <Button onClick={handleSaveCustomMessage} disabled={savingMessage} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl">
                    {savingMessage ? 'Saving...' : 'Save Message'}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="portal" className="space-y-4 mt-4">
                {!vaultKey && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm mb-3">
                    <Lock className="w-4 h-4 shrink-0" />
                    Unlock your vault first to generate portal links.
                  </div>
                )}
                {isFree ? (
                  <UpgradePrompt message="Portal access requires a paid plan. Upgrade to generate portal links so your contacts can securely access shared information." featureKey="portal" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button onClick={handleGeneratePortalLink} disabled={generatingLink || !vaultKey} size="sm" variant="outline" className="rounded-xl">
                        <Link2 className="w-4 h-4 mr-2" />
                        {generatingLink ? 'Generating...' : portalLink ? 'Regenerate Portal Link' : 'Generate Portal Link'}
                      </Button>
                      <Button onClick={handlePreviewPortal} disabled={previewingPortal || !vaultKey} size="sm" variant="outline" className="rounded-xl">
                        <Eye className="w-4 h-4 mr-2" />
                        {previewingPortal ? 'Loading...' : 'Preview Portal'}
                      </Button>
                    </div>
                    {portalLink && (
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="text-sm text-primary truncate flex-1">{portalLink}</p>
                        <Button size="sm" variant="ghost" className="text-primary flex-shrink-0" onClick={() => { navigator.clipboard.writeText(portalLink); toast({ title: "Copied!", description: "Portal link copied to clipboard." }); }}>
                          Copy
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-foreground">Relationship:</Label>
                    <span className="text-muted-foreground">{contact.relationship}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Label className="text-foreground">Phone:</Label>
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">{contact.phone}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label className="text-foreground">Can Receive Messages:</Label>
                    <span className="text-muted-foreground">{contact.can_receive_messages ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-foreground">Created At:</Label>
                    <span className="text-muted-foreground">{formatDateEU(contact.created_at)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCard;