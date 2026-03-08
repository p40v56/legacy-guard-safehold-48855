import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';
import { Shield } from 'lucide-react';
import { User, Mail, Phone, Users, Hash, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import RichTextEditor from '@/components/ui/rich-text-editor';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong border-none rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-card-foreground">
            {isEditing ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-card-foreground font-medium">Full Name</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={contactData.name || ''}
                onChange={(e) => handleInputChange(e, 'name')}
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                placeholder="Enter contact's full name"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={contactData.email || ''}
                  onChange={(e) => handleInputChange(e, 'email')}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  value={contactData.phone || ''}
                  onChange={(e) => handleInputChange(e, 'phone')}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Relationship & Contact Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Relationship</Label>
              <Input
                value={contactData.relationship || ''}
                onChange={(e) => handleInputChange(e, 'relationship')}
                className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                placeholder="e.g., Spouse, Sibling, Friend"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Contact Type</Label>
              <Select 
                value={contactData.contact_type || 'immediate_family'} 
                onValueChange={(value) => handleSelectChange(value, 'contact_type')}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="Select a contact type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(contactTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="rounded-lg">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Messages */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-card-foreground font-medium">Notification Priority</Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={contactData.priority_order || 1}
                  onChange={(e) => setContactData({ ...contactData, priority_order: parseInt(e.target.value) || 1 })}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Contacts with lower numbers are notified first</p>
            </div>
            <div className="flex items-center space-x-3 mt-8 p-4 bg-muted/20 rounded-2xl">
              <Switch
                checked={contactData.can_receive_messages || true}
                onCheckedChange={(checked) => handleSwitchChange(checked, 'can_receive_messages')}
                id="can_receive_messages"
              />
              <Label htmlFor="can_receive_messages" className="text-card-foreground font-medium cursor-pointer">
                Can Receive Messages
              </Label>
            </div>
          </div>

          <Button
            onClick={onSubmit} 
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            {isEditing ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
