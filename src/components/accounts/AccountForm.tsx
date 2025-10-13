
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';

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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-primary" />
          {isEditing ? 'Edit Account' : 'Add New Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Account Name *</Label>
              <Input
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="bg-input border-input text-foreground"
                placeholder="My Gmail Account"
                required
              />
            </div>
            <div>
              <Label className="text-foreground">Platform *</Label>
              <Input
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                className="bg-input border-input text-foreground"
                placeholder="Gmail, Facebook, etc."
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Account Type</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(value: AccountType) => setFormData({...formData, account_type: value})}
              >
                <SelectTrigger className="bg-input border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Website URL</Label>
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                className="bg-input border-input text-foreground"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-input border-input text-foreground"
                placeholder="user@example.com"
                type="email"
              />
            </div>
            <div>
              <Label className="text-foreground">Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="bg-input border-input text-foreground"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-input border-input text-foreground"
              rows={3}
              placeholder="Additional notes about this account..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {isEditing ? 'Update Account' : 'Add Account'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccountForm;
