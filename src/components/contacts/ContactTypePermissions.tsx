
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Save } from 'lucide-react';
import { ContactType, ContactTypePermissions, ContactPermissions } from '@/types/access-control';
import PermissionsConfig from './PermissionsConfig';

interface ContactTypePermissionsProps {
  typePermissions: ContactTypePermissions[];
  onUpdate: (typePermissions: ContactTypePermissions[]) => void;
}

const contactTypeLabels: Record<ContactType, string> = {
  immediate_family: 'Immediate Family',
  extended_family: 'Extended Family',
  close_friends: 'Close Friends',
  professional: 'Professional',
  legal: 'Legal',
  financial: 'Financial',
};

const defaultPermissions: ContactPermissions = {
  digital_accounts: {
    all_accounts: false,
    by_category: [],
    specific_accounts: [],
  },
  legacy_documents: {
    all_documents: false,
    by_category: [],
    specific_documents: [],
  },
  contact_information: false,
  emergency_instructions: false,
  can_modify_information: false,
};

const ContactTypePermissions = ({ typePermissions, onUpdate }: ContactTypePermissionsProps) => {
  const [selectedType, setSelectedType] = useState<ContactType>('immediate_family');

  const currentTypePermissions = typePermissions.find(tp => tp.contact_type === selectedType);

  const updateTypePermissions = (permissions: ContactPermissions) => {
    const updatedTypePermissions = typePermissions.map(tp =>
      tp.contact_type === selectedType
        ? { ...tp, default_permissions: permissions }
        : tp
    );

    // If this contact type doesn't exist yet, add it
    if (!currentTypePermissions) {
      updatedTypePermissions.push({
        contact_type: selectedType,
        default_permissions: permissions,
      });
    }

    onUpdate(updatedTypePermissions);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-400" />
            Default Permissions by Contact Type
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Configure default access permissions for each contact type. Individual contacts can override these defaults.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-200">Select Contact Type</Label>
            <Select value={selectedType} onValueChange={(value: ContactType) => setSelectedType(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(contactTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-200">Configuring permissions for:</span>
            <Badge variant="outline" className="border-emerald-600 text-emerald-400">
              {contactTypeLabels[selectedType]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <PermissionsConfig
        permissions={currentTypePermissions?.default_permissions || defaultPermissions}
        onChange={updateTypePermissions}
        useTypeDefaults={false}
        onUseTypeDefaultsChange={() => {}}
        disabled={false}
      />
    </div>
  );
};

export default ContactTypePermissions;
