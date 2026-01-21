
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
          <TabsList className="grid w-full grid-cols-2 bg-muted/20 border-border">
            <TabsTrigger value="permissions" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Permissions
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
