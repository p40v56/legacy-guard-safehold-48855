import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, FileText, CreditCard, Key, AlertCircle } from 'lucide-react';

interface ContactPermissions {
  contact_information: boolean;
  emergency_instructions: boolean;
  can_modify_information: boolean;
  digital_accounts: {
    all_accounts: boolean;
    by_category: string[];
    specific_accounts: string[];
  };
  legacy_documents: {
    all_documents: boolean;
    by_category: string[];
    specific_documents: string[];
  };
}

interface ContactPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  permissions: ContactPermissions;
  onSave: (permissions: ContactPermissions) => void;
}

const ContactPermissionsDialog = ({
  open,
  onOpenChange,
  contactName,
  permissions,
  onSave
}: ContactPermissionsDialogProps) => {
  const [localPermissions, setLocalPermissions] = useState<ContactPermissions>(permissions);

  const handleSave = () => {
    onSave(localPermissions);
    onOpenChange(false);
  };

  const updatePermission = (path: string, value: any) => {
    setLocalPermissions(prev => {
      const newPermissions = { ...prev };
      const keys = path.split('.');
      let current: any = newPermissions;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newPermissions;
    });
  };

  const accountCategories = [
    { id: 'social', label: 'Social Media', icon: User },
    { id: 'financial', label: 'Financial', icon: CreditCard },
    { id: 'email', label: 'Email', icon: FileText },
    { id: 'cloud', label: 'Cloud Storage', icon: Shield },
    { id: 'subscription', label: 'Subscriptions', icon: Key }
  ];

  const documentCategories = [
    { id: 'legal', label: 'Legal Documents' },
    { id: 'financial', label: 'Financial Records' },
    { id: 'personal', label: 'Personal Documents' },
    { id: 'medical', label: 'Medical Records' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            Permissions for {contactName}
          </DialogTitle>
          <p className="text-slate-400" id="dialog-description">
            Configure what information and assets this contact can access during an emergency
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Information Access */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Basic Information Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200 font-medium">Contact Information</Label>
                  <p className="text-sm text-slate-400">Allow access to other emergency contacts</p>
                </div>
                <Switch
                  checked={localPermissions.contact_information}
                  onCheckedChange={(checked) => updatePermission('contact_information', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200 font-medium">Emergency Instructions</Label>
                  <p className="text-sm text-slate-400">Access to special instructions and messages</p>
                </div>
                <Switch
                  checked={localPermissions.emergency_instructions}
                  onCheckedChange={(checked) => updatePermission('emergency_instructions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200 font-medium">Modify Information</Label>
                  <p className="text-sm text-slate-400">Can update and modify accessible information</p>
                </div>
                <Switch
                  checked={localPermissions.can_modify_information}
                  onCheckedChange={(checked) => updatePermission('can_modify_information', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Digital Accounts */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                Digital Accounts Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-600/30 rounded-lg">
                <div>
                  <Label className="text-slate-200 font-medium">All Accounts</Label>
                  <p className="text-sm text-slate-400">Grant access to all digital accounts</p>
                </div>
                <Switch
                  checked={localPermissions.digital_accounts.all_accounts}
                  onCheckedChange={(checked) => updatePermission('digital_accounts.all_accounts', checked)}
                />
              </div>

              {!localPermissions.digital_accounts.all_accounts && (
                <div className="space-y-3">
                  <Label className="text-slate-200 font-medium">By Category</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {accountCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <div key={category.id} className="flex items-center space-x-3 p-3 bg-slate-600/20 rounded-lg">
                          <Checkbox
                            id={category.id}
                            checked={localPermissions.digital_accounts.by_category.includes(category.id)}
                            onCheckedChange={(checked) => {
                              const newCategories = checked
                                ? [...localPermissions.digital_accounts.by_category, category.id]
                                : localPermissions.digital_accounts.by_category.filter(c => c !== category.id);
                              updatePermission('digital_accounts.by_category', newCategories);
                            }}
                          />
                          <Icon className="w-4 h-4 text-slate-400" />
                          <Label htmlFor={category.id} className="text-slate-200 text-sm">
                            {category.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legacy Documents */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Legacy Documents Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-600/30 rounded-lg">
                <div>
                  <Label className="text-slate-200 font-medium">All Documents</Label>
                  <p className="text-sm text-slate-400">Grant access to all stored documents</p>
                </div>
                <Switch
                  checked={localPermissions.legacy_documents.all_documents}
                  onCheckedChange={(checked) => updatePermission('legacy_documents.all_documents', checked)}
                />
              </div>

              {!localPermissions.legacy_documents.all_documents && (
                <div className="space-y-3">
                  <Label className="text-slate-200 font-medium">By Category</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {documentCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-3 p-3 bg-slate-600/20 rounded-lg">
                        <Checkbox
                          id={`doc-${category.id}`}
                          checked={localPermissions.legacy_documents.by_category.includes(category.id)}
                          onCheckedChange={(checked) => {
                            const newCategories = checked
                              ? [...localPermissions.legacy_documents.by_category, category.id]
                              : localPermissions.legacy_documents.by_category.filter(c => c !== category.id);
                            updatePermission('legacy_documents.by_category', newCategories);
                          }}
                        />
                        <FileText className="w-4 h-4 text-slate-400" />
                        <Label htmlFor={`doc-${category.id}`} className="text-slate-200 text-sm">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Security Notice</p>
              <p className="text-amber-200/80 text-sm">
                These permissions will only take effect during an emergency activation. 
                Contacts cannot access your information under normal circumstances.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-600">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
          >
            Save Permissions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactPermissionsDialog;