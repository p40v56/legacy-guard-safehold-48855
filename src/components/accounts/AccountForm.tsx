import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Globe, Mail, User, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEncryption } from '@/contexts/EncryptionContext';
import { supabase } from '@/integrations/supabase/client';
import { decryptFields } from '@/lib/crypto';

type AccountType = 'email' | 'social' | 'financial' | 'work' | 'device' | 'entertainment' | 'other';

interface AccountFormData {
  account_name: string;
  platform: string;
  account_type: AccountType;
  email: string;
  username: string;
  website_url: string;
  notes: string;
  credentials: string;
  closure_action: string;
  attached_document_ids?: string[];
}

interface AccountFormProps {
  formData: AccountFormData;
  setFormData: (data: AccountFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEditing
}) => {
  const { user } = useAuth();
  const { vaultKey } = useEncryption();
  const [availableDocs, setAvailableDocs] = useState<{id: string; title: string; document_type: string}[]>([]);
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>(formData.attached_document_ids || []);

  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('legacy_documents')
        .select('id, title, title_iv, document_type')
        .eq('user_id', user.id);
      if (!data) return;
      const docs = await Promise.all(data.map(async (doc) => {
        let title = doc.title;
        if (vaultKey && doc.title_iv) {
          try {
            const decrypted = await decryptFields(doc, ['title'], vaultKey);
            title = decrypted.title || doc.title;
          } catch { /* use raw */ }
        }
        return { id: doc.id, title, document_type: doc.document_type };
      }));
      setAvailableDocs(docs);
    };
    fetchDocs();
  }, [user, vaultKey]);

  // Sync attachedDocIds back to formData on change
  useEffect(() => {
    if (JSON.stringify(attachedDocIds) !== JSON.stringify(formData.attached_document_ids || [])) {
      setFormData({ ...formData, attached_document_ids: attachedDocIds });
    }
  }, [attachedDocIds]);

  // Sync from formData when it changes externally (e.g. editing different account)
  useEffect(() => {
    setAttachedDocIds(formData.attached_document_ids || []);
  }, [formData.account_name, isEditing]);

  return (
    <Card className="glass border-none rounded-3xl overflow-hidden">
      <CardHeader className="bg-primary/10 pb-6">
        <CardTitle className="text-xl font-medium text-card-foreground flex items-center">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mr-3">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          {isEditing ? 'Edit Account' : 'Add New Account'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Account Name & Platform */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Account Name *</Label>
              <Input
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                placeholder={formData.account_type === 'device' ? 'e.g. iPhone, MacBook, Home Safe, Alarm System' : 'My Gmail Account'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Platform *</Label>
              <Input
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                placeholder="Gmail, Facebook, etc."
                required
              />
            </div>
          </div>

          {/* Account Type & Website */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Account Type</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(value: AccountType) => setFormData({...formData, account_type: value})}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="social" className="rounded-lg">Social Media</SelectItem>
                  <SelectItem value="financial" className="rounded-lg">Financial</SelectItem>
                  <SelectItem value="email" className="rounded-lg">Email</SelectItem>
                  <SelectItem value="work" className="rounded-lg">Work</SelectItem>
                  <SelectItem value="device" className="rounded-lg">Device & Physical</SelectItem>
                  <SelectItem value="entertainment" className="rounded-lg">Entertainment</SelectItem>
                  <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.account_type !== 'device' && (
              <div className="space-y-2">
                <Label className="text-card-foreground font-medium">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={formData.website_url}
                    onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {formData.account_type === 'device' && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-lg">💡</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use this for phone PINs, laptop passwords, safe combinations, alarm codes, car/house key locations, and any physical access codes your family will need immediately.
              </p>
            </div>
          )

          {/* Email & Username */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder="user@example.com"
                  type="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">{formData.account_type === 'device' ? 'Code / PIN' : 'Username'}</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder={formData.account_type === 'device' ? 'e.g. PIN, combination, code' : 'username'}
                />
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="space-y-2">
            <Label className="text-card-foreground font-medium">Credentials / Password Hint</Label>
            <Textarea
              value={formData.credentials}
              onChange={(e) => setFormData({...formData, credentials: e.target.value})}
              className="rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all min-h-[80px]"
              placeholder="Password hint, recovery codes, or other credential info (encrypted)..."
            />
            <p className="text-xs text-muted-foreground">This field is end-to-end encrypted and only visible to authorized contacts.</p>
          </div>

          {/* Closure Action */}
          <div className="space-y-2">
            <Label className="text-card-foreground font-medium">Closure Action</Label>
            <Select
              value={formData.closure_action || 'none'}
              onValueChange={(value) => setFormData({...formData, closure_action: value === 'none' ? '' : value})}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all">
                <SelectValue placeholder="What should contacts do with this account?" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="rounded-lg">No action specified</SelectItem>
                <SelectItem value="delete" className="rounded-lg">Delete this account</SelectItem>
                <SelectItem value="memorialize" className="rounded-lg">Memorialize</SelectItem>
                <SelectItem value="transfer" className="rounded-lg">Transfer to someone</SelectItem>
                <SelectItem value="download" className="rounded-lg">Download data then close</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-card-foreground font-medium">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all min-h-[100px]"
              placeholder="Additional notes about this account..."
            />
          </div>

          {/* Linked Documents */}
          <div className="space-y-3">
            <Label className="text-card-foreground font-medium">Linked Documents</Label>
            <p className="text-xs text-muted-foreground">Attach relevant documents to this account</p>
            {availableDocs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableDocs.map(doc => (
                  <div key={doc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`acct-doc-${doc.id}`}
                      checked={attachedDocIds.includes(doc.id)}
                      onCheckedChange={(checked) => {
                        setAttachedDocIds(prev =>
                          checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id)
                        );
                      }}
                    />
                    <label htmlFor={`acct-doc-${doc.id}`} className="text-sm text-card-foreground cursor-pointer flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      {doc.title}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{doc.document_type}</Badge>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No documents yet. Upload documents in the Documents section first.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {isEditing ? 'Update Account' : 'Add Account'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="h-14 px-8 rounded-2xl border-border hover:bg-muted/50 transition-all"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccountForm;
