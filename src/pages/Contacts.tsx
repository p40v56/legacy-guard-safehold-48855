import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PermissionsConfig from '@/components/contacts/PermissionsConfig';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Users, Plus, Edit, Trash2, UserPlus, AlertCircle, Phone, Mail, Shield } from 'lucide-react';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';

const Contacts = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const contactTypeLabels: Record<ContactType, string> = {
    immediate_family: 'Immediate Family',
    extended_family: 'Extended Family',
    close_friends: 'Close Friends',
    professional: 'Professional',
    legal: 'Legal',
    financial: 'Financial',
  };

  const getDefaultPermissions = (contactType: ContactType): ContactPermissions => {
    return {
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
  };

  const fetchContacts = async () => {
    try {
      // Mock data loading - replace with your actual data fetching logic
      const mockContacts: EmergencyContact[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          relationship: 'Husband',
          contact_type: 'immediate_family',
          priority_order: 1,
          can_receive_messages: true,
          use_type_defaults: true,
          permissions: getDefaultPermissions('immediate_family'),
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1 (555) 987-6543',
          relationship: 'Sister',
          contact_type: 'extended_family',
          priority_order: 2,
          can_receive_messages: false,
          use_type_defaults: false,
          permissions: {
            digital_accounts: {
              all_accounts: false,
              by_category: ['banking'],
              specific_accounts: [],
            },
            legacy_documents: {
              all_documents: false,
              by_category: ['legal'],
              specific_documents: [],
            },
            contact_information: true,
            emergency_instructions: true,
            can_modify_information: false,
          },
          created_at: new Date().toISOString(),
        },
      ];

      setContacts(mockContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSaveContact = async (contactData: EmergencyContact) => {
    try {
      // Mock save - in a real app this would save to your backend
      await new Promise(resolve => setTimeout(resolve, 500));

      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === contactData.id ? contactData : contact
        )
      );

      toast({
        title: "Success",
        description: "Contact updated successfully"
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
    } finally {
      setEditingContact(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      // Mock delete - in a real app this would delete from your backend
      await new Promise(resolve => setTimeout(resolve, 500));

      setContacts(prevContacts =>
        prevContacts.filter(contact => contact.id !== contactId)
      );

      toast({
        title: "Success",
        description: "Contact deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      });
    }
  };

  const handleCreateContact = async (newContactData: Omit<EmergencyContact, 'id' | 'created_at'>) => {
    try {
      // Mock create - in a real app this would save to your backend
      await new Promise(resolve => setTimeout(resolve, 500));

      const newContact: EmergencyContact = {
        id: `contact-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...newContactData,
      };

      setContacts(prevContacts => [...prevContacts, newContact]);

      toast({
        title: "Success",
        description: "Contact created successfully"
      });
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive"
      });
    } finally {
      setNewContact({
        name: '',
        email: '',
        phone: '',
        relationship: '',
        contact_type: 'immediate_family',
        priority_order: 1,
        can_receive_messages: true,
        use_type_defaults: true,
        permissions: getDefaultPermissions('immediate_family')
      });
      setIsDialogOpen(false);
    }
  };

  const handlePermissionsChange = (contactId: string, newPermissions: ContactPermissions) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId
          ? { ...contact, permissions: newPermissions }
          : contact
      )
    );
  };

  const handleUseTypeDefaultsChange = (contactId: string, useDefaults: boolean) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === contactId
          ? { ...contact, use_type_defaults: useDefaults }
          : contact
      )
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setNewContact({ ...newContact, [field]: e.target.value });
  };

  const handleSelectChange = (value: string, field: string) => {
    setNewContact({ ...newContact, [field]: value });
  };

  const handleSwitchChange = (checked: boolean, field: string) => {
    setNewContact({ ...newContact, [field]: checked });
  };

  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    contact_type: 'immediate_family',
    priority_order: 1,
    can_receive_messages: true,
    use_type_defaults: true,
    permissions: getDefaultPermissions('immediate_family')
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading emergency contacts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Emergency Contacts</h1>
            <p className="text-slate-400">
              Manage your trusted contacts who will be notified when your Dead Man's Switch is triggered
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <Label className="text-slate-200">Full Name</Label>
                  <Input
                    value={newContact.name || ''}
                    onChange={(e) => handleInputChange(e, 'name')}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter contact's full name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Email Address</Label>
                    <Input
                      type="email"
                      value={newContact.email || ''}
                      onChange={(e) => handleInputChange(e, 'email')}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter contact's email"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Phone Number</Label>
                    <Input
                      type="tel"
                      value={newContact.phone || ''}
                      onChange={(e) => handleInputChange(e, 'phone')}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Relationship</Label>
                    <Input
                      value={newContact.relationship || ''}
                      onChange={(e) => handleInputChange(e, 'relationship')}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Spouse, Sibling, Friend"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Contact Type</Label>
                    <Select value={newContact.contact_type || 'immediate_family'} onValueChange={(value) => handleSelectChange(value, 'contact_type')}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
                    <Label className="text-slate-200">Priority Order</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newContact.priority_order || 1}
                      onChange={(e) => handleInputChange(e, 'priority_order')}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      checked={newContact.can_receive_messages || true}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'can_receive_messages')}
                      id="can_receive_messages"
                    />
                    <Label htmlFor="can_receive_messages" className="text-slate-200">
                      Can Receive Messages
                    </Label>
                  </div>
                </div>

                <div>
                  <PermissionsConfig
                    permissions={newContact.permissions || getDefaultPermissions(newContact.contact_type as ContactType)}
                    onChange={(permissions) => setNewContact({ ...newContact, permissions })}
                    useTypeDefaults={newContact.use_type_defaults || true}
                    onUseTypeDefaultsChange={(useDefaults) => setNewContact({ ...newContact, use_type_defaults: useDefaults })}
                  />
                </div>

                <Button onClick={() => handleCreateContact(newContact as EmergencyContact)} className="bg-emerald-600 hover:bg-emerald-500">
                  Add Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contacts List */}
        <div className="grid gap-4">
          {contacts.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Emergency Contacts</h3>
                <p className="text-slate-400 text-center mb-4">
                  Start by adding your first emergency contact who will be notified if something happens to you.
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} className="bg-slate-800/50 border-slate-700">
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
                        onClick={() => setEditingContact(contact)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
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
                        onChange={(permissions) => handlePermissionsChange(contact.id, permissions)}
                        useTypeDefaults={contact.use_type_defaults}
                        onUseTypeDefaultsChange={(useDefaults) => handleUseTypeDefaultsChange(contact.id, useDefaults)}
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
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
