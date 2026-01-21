
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import PermissionsConfig from '@/components/contacts/PermissionsConfig';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';

interface ContactDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contactData: Partial<EmergencyContact>;
  setContactData: (data: Partial<EmergencyContact>) => void;
  onSubmit: () => void;
  contactTypeLabels: Record<ContactType, string>;
  isEditing: boolean;
}

const ContactDialog: React.FC<ContactDialogProps> = ({
  isOpen,
  onOpenChange,
  contactData,
  setContactData,
  onSubmit,
  contactTypeLabels,
  isEditing
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setContactData({ ...contactData, [field]: e.target.value });
  };

  const handleSelectChange = (value: string, field: string) => {
    setContactData({ ...contactData, [field]: value });
  };

  const handleSwitchChange = (checked: boolean, field: string) => {
    setContactData({ ...contactData, [field]: checked });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-foreground">Full Name</Label>
            <Input
              value={contactData.name || ''}
              onChange={(e) => handleInputChange(e, 'name')}
              className="bg-input border-border text-foreground"
              placeholder="Enter contact's full name"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Email Address</Label>
              <Input
                type="email"
                value={contactData.email || ''}
                onChange={(e) => handleInputChange(e, 'email')}
                className="bg-input border-border text-foreground"
                placeholder="Enter contact's email"
              />
            </div>
            <div>
              <Label className="text-foreground">Phone Number</Label>
              <Input
                type="tel"
                value={contactData.phone || ''}
                onChange={(e) => handleInputChange(e, 'phone')}
                className="bg-input border-border text-foreground"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Relationship</Label>
              <Input
                value={contactData.relationship || ''}
                onChange={(e) => handleInputChange(e, 'relationship')}
                className="bg-input border-border text-foreground"
                placeholder="e.g., Spouse, Sibling, Friend"
              />
            </div>
            <div>
              <Label className="text-foreground">Contact Type</Label>
              <Select 
                value={contactData.contact_type || 'immediate_family'} 
                onValueChange={(value) => handleSelectChange(value, 'contact_type')}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select a contact type" />
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Priority Order</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={contactData.priority_order || 1}
                onChange={(e) => handleInputChange(e, 'priority_order')}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Switch
                checked={contactData.can_receive_messages || true}
                onCheckedChange={(checked) => handleSwitchChange(checked, 'can_receive_messages')}
                id="can_receive_messages"
              />
              <Label htmlFor="can_receive_messages" className="text-foreground">
                Can Receive Messages
              </Label>
            </div>
          </div>

          <div>
            <PermissionsConfig
              permissions={contactData.permissions as ContactPermissions}
              onChange={(permissions) => setContactData({ ...contactData, permissions })}
              useTypeDefaults={contactData.use_type_defaults || true}
              onUseTypeDefaultsChange={(useDefaults) => setContactData({ ...contactData, use_type_defaults: useDefaults })}
            />
          </div>

          <Button onClick={onSubmit} className="bg-primary hover:bg-primary/90">
            {isEditing ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
