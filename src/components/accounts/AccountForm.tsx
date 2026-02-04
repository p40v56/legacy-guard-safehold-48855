import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Globe, Mail, User, FileText } from 'lucide-react';

type AccountType = 'email' | 'social' | 'financial' | 'work' | 'entertainment' | 'other';

interface AccountFormData {
  account_name: string;
  platform: string;
  account_type: AccountType;
  email: string;
  username: string;
  website_url: string;
  notes: string;
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
                placeholder="My Gmail Account"
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
                  <SelectItem value="entertainment" className="rounded-lg">Entertainment</SelectItem>
                  <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>

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
              <Label className="text-card-foreground font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder="username"
                />
              </div>
            </div>
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
