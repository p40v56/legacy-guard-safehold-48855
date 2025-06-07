
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Phone, Mail, Shield, AlertCircle } from 'lucide-react';
import PermissionsConfig from '@/components/contacts/PermissionsConfig';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';

interface ContactCardProps {
  contact: EmergencyContact;
  contactTypeLabels: Record<ContactType, string>;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (contactId: string) => void;
  onPermissionsChange: (contactId: string, permissions: ContactPermissions) => void;
  onUseTypeDefaultsChange: (contactId: string, useDefaults: boolean) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  contactTypeLabels,
  onEdit,
  onDelete,
  onPermissionsChange,
  onUseTypeDefaultsChange
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">{contact.name}</h3>
            <p className="text-slate-400">{contactTypeLabels[contact.contact_type]}</p>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <a href={`mailto:${contact.email}`} className="text-blue-400 hover:underline">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href={`tel:${contact.phone}`} className="text-blue-400 hover:underline">
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
              className="text-blue-400 hover:text-blue-300"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(contact.id)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/20 border-slate-600">
            <TabsTrigger value="permissions" className="data-[state=active]:bg-slate-600/30 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-slate-600/30 data-[state=active]:text-white">
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
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-slate-200">Relationship:</Label>
                <span className="text-slate-300">{contact.relationship}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-slate-200">Can Receive Messages:</Label>
                <span className="text-slate-300">{contact.can_receive_messages ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-slate-200">Created At:</Label>
                <span className="text-slate-300">{new Date(contact.created_at).toLocaleString()}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContactCard;
