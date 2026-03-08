
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, CreditCard, Users, Settings } from 'lucide-react';
import { ContactPermissions, DigitalAccountCategory, DocumentCategory } from '@/types/access-control';

interface PermissionsConfigProps {
  permissions: ContactPermissions;
  onChange: (permissions: ContactPermissions) => void;
  useTypeDefaults: boolean;
  onUseTypeDefaultsChange: (useDefaults: boolean) => void;
  disabled?: boolean;
  hideDefaultsToggle?: boolean;
}

const digitalAccountCategories: { value: DigitalAccountCategory; label: string }[] = [
  { value: 'banking', label: 'Banking & Finance' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email', label: 'Email Accounts' },
  { value: 'shopping', label: 'Shopping & E-commerce' },
  { value: 'utilities', label: 'Utilities & Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

const documentCategories: { value: DocumentCategory; label: string }[] = [
  { value: 'legal', label: 'Legal Documents' },
  { value: 'financial', label: 'Financial Records' },
  { value: 'medical', label: 'Medical Records' },
  { value: 'personal', label: 'Personal Documents' },
  { value: 'insurance', label: 'Insurance Policies' },
  { value: 'property', label: 'Property & Assets' },
  { value: 'other', label: 'Other Documents' },
];

const PermissionsConfig = ({ 
  permissions, 
  onChange, 
  useTypeDefaults, 
  onUseTypeDefaultsChange,
  disabled = false,
  hideDefaultsToggle = false
}: PermissionsConfigProps) => {
  const updateDigitalAccounts = (updates: Partial<typeof permissions.digital_accounts>) => {
    onChange({
      ...permissions,
      digital_accounts: { ...permissions.digital_accounts, ...updates }
    });
  };

  const updateDocuments = (updates: Partial<typeof permissions.legacy_documents>) => {
    onChange({
      ...permissions,
      legacy_documents: { ...permissions.legacy_documents, ...updates }
    });
  };

  const toggleDigitalAccountCategory = (category: DigitalAccountCategory) => {
    const currentCategories = permissions.digital_accounts.by_category;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    updateDigitalAccounts({ by_category: newCategories });
  };

  const toggleDocumentCategory = (category: DocumentCategory) => {
    const currentCategories = permissions.legacy_documents.by_category;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    updateDocuments({ by_category: newCategories });
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          Access Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Use Type Defaults Toggle - hidden when configuring the defaults themselves */}
        {onUseTypeDefaultsChange !== undefined && onUseTypeDefaultsChange.toString() !== '() => {}' && (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-foreground">Use Contact Type Defaults</Label>
              <p className="text-xs text-muted-foreground">Use default permissions for this contact type instead of custom settings</p>
            </div>
            <Switch
              checked={useTypeDefaults}
              onCheckedChange={onUseTypeDefaultsChange}
              disabled={disabled}
            />
          </div>
        )}

        {!useTypeDefaults && (
          <>
            <Tabs defaultValue="digital" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 border-border">
                <TabsTrigger value="digital">Digital Accounts</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
              </TabsList>

              <TabsContent value="digital" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Access to All Digital Accounts</Label>
                    <Switch
                      checked={permissions.digital_accounts.all_accounts}
                      onCheckedChange={(checked) => updateDigitalAccounts({ all_accounts: checked })}
                      disabled={disabled}
                    />
                  </div>

                  {!permissions.digital_accounts.all_accounts && (
                    <div className="space-y-3">
                      <Label className="text-foreground">Access by Category</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {digitalAccountCategories.map((category) => (
                          <div key={category.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={permissions.digital_accounts.by_category.includes(category.value)}
                              onCheckedChange={() => toggleDigitalAccountCategory(category.value)}
                              disabled={disabled}
                            />
                            <Label className="text-muted-foreground text-sm">{category.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Access to All Documents</Label>
                    <Switch
                      checked={permissions.legacy_documents.all_documents}
                      onCheckedChange={(checked) => updateDocuments({ all_documents: checked })}
                      disabled={disabled}
                    />
                  </div>

                  {!permissions.legacy_documents.all_documents && (
                    <div className="space-y-3">
                      <Label className="text-foreground">Access by Category</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {documentCategories.map((category) => (
                          <div key={category.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={permissions.legacy_documents.by_category.includes(category.value)}
                              onCheckedChange={() => toggleDocumentCategory(category.value)}
                              disabled={disabled}
                            />
                            <Label className="text-muted-foreground text-sm">{category.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Contact Information</Label>
                      <p className="text-xs text-muted-foreground">Access to other emergency contacts</p>
                    </div>
                    <Switch
                      checked={permissions.contact_information}
                      onCheckedChange={(checked) => onChange({ ...permissions, contact_information: checked })}
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Emergency Instructions</Label>
                      <p className="text-xs text-muted-foreground">Access to your emergency instructions and preferences</p>
                    </div>
                    <Switch
                      checked={permissions.emergency_instructions}
                      onCheckedChange={(checked) => onChange({ ...permissions, emergency_instructions: checked })}
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Modify Information</Label>
                      <p className="text-xs text-muted-foreground">Allow updates to accessible information</p>
                    </div>
                    <Switch
                      checked={permissions.can_modify_information}
                      onCheckedChange={(checked) => onChange({ ...permissions, can_modify_information: checked })}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {useTypeDefaults && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-primary text-sm">
              This contact will use the default permissions configured for their contact type. 
              You can modify these defaults in the Settings page.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionsConfig;
