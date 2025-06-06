import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Edit, Trash2, Phone, Mail, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import SearchInput from '@/components/ui/search-input';
import PermissionsConfig from '@/components/contacts/PermissionsConfig';
import ContactTypePermissions from '@/components/contacts/ContactTypePermissions';
import { EmergencyContact, ContactType, ContactPermissions, ContactTypePermissions as ContactTypePermissionsType } from '@/types/access-control';

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [typePermissions, setTypePermissions] = useState<ContactTypePermissionsType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    contact_type: 'immediate_family' as ContactType,
    priority_order: 1,
    can_receive_messages: true,
    use_type_defaults: true,
    permissions: {
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
    } as ContactPermissions,
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const name = (contact.name || '').toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const phone = (contact.phone || '').toLowerCase();
      const relationship = (contact.relationship || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        relationship.includes(searchLower);
      
      const matchesFilter = filterType === 'all' || contact.contact_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [contacts, searchTerm, filterType]);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      // Mock data with new permissions structure
      const mockContacts: EmergencyContact[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          relationship: 'Spouse',
          contact_type: 'immediate_family',
          priority_order: 1,
          can_receive_messages: true,
          use_type_defaults: true,
          permissions: {
            digital_accounts: { all_accounts: true, by_category: [], specific_accounts: [] },
            legacy_documents: { all_documents: true, by_category: [], specific_documents: [] },
            contact_information: true,
            emergency_instructions: true,
            can_modify_information: true,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1 (555) 987-6543',
          relationship: 'Sister',
          contact_type: 'extended_family',
          priority_order: 2,
          can_receive_messages: true,
          use_type_defaults: false,
          permissions: {
            digital_accounts: { all_accounts: false, by_category: ['banking'], specific_accounts: [] },
            legacy_documents: { all_documents: false, by_category: ['legal', 'financial'], specific_documents: [] },
            contact_information: true,
            emergency_instructions: true,
            can_modify_information: false,
          },
          created_at: new Date().toISOString(),
        }
      ];
      setContacts(mockContacts);

      // Mock default type permissions
      const mockTypePermissions: ContactTypePermissionsType[] = [
        {
          contact_type: 'immediate_family',
          default_permissions: {
            digital_accounts: { all_accounts: true, by_category: [], specific_accounts: [] },
            legacy_documents: { all_documents: true, by_category: [], specific_documents: [] },
            contact_information: true,
            emergency_instructions: true,
            can_modify_information: true,
          },
        },
        {
          contact_type: 'extended_family',
          default_permissions: {
            digital_accounts: { all_accounts: false, by_category: ['banking'], specific_accounts: [] },
            legacy_documents: { all_documents: false, by_category: ['legal'], specific_accounts: [] },
            contact_information: true,
            emergency_instructions: true,
            can_modify_information: false,
          },
        },
      ];
      setTypePermissions(mockTypePermissions);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        // Mock update
        setContacts(prev => prev.map(contact => 
          contact.id === editingContact.id 
            ? { 
                ...contact, 
                ...formData,
                permissions: formData.permissions,
                use_type_defaults: formData.use_type_defaults,
              }
            : contact
        ));
        
        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
      } else {
        // Mock create
        const newContact: EmergencyContact = {
          ...formData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        };
        setContacts(prev => [...prev, newContact]);
        
        toast({
          title: "Success",
          description: "Contact added successfully",
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      relationship: contact.relationship || '',
      contact_type: contact.contact_type,
      priority_order: contact.priority_order,
      can_receive_messages: contact.can_receive_messages,
      use_type_defaults: contact.use_type_defaults,
      permissions: contact.permissions,
    });
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: '',
      contact_type: 'immediate_family',
      priority_order: 1,
      can_receive_messages: true,
      use_type_defaults: true,
      permissions: {
        digital_accounts: { all_accounts: false, by_category: [], specific_accounts: [] },
        legacy_documents: { all_documents: false, by_category: [], specific_documents: [] },
        contact_information: false,
        emergency_instructions: false,
        can_modify_information: false,
      },
    });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const getContactTypeLabel = (type: ContactType) => {
    const labels = {
      immediate_family: 'Immediate Family',
      extended_family: 'Extended Family',
      close_friends: 'Close Friends',
      professional: 'Professional',
      legal: 'Legal',
      financial: 'Financial',
    };
    return labels[type];
  };

  const getPermissionsSummary = (contact: EmergencyContact) => {
    if (contact.use_type_defaults) {
      return "Using type defaults";
    }
    
    const { permissions } = contact;
    const summary = [];
    
    if (permissions.digital_accounts.all_accounts) {
      summary.push("All Accounts");
    } else if (permissions.digital_accounts.by_category.length > 0) {
      summary.push(`${permissions.digital_accounts.by_category.length} Account Categories`);
    }
    
    if (permissions.legacy_documents.all_documents) {
      summary.push("All Documents");
    } else if (permissions.legacy_documents.by_category.length > 0) {
      summary.push(`${permissions.legacy_documents.by_category.length} Document Categories`);
    }
    
    return summary.length > 0 ? summary.join(", ") : "Limited access";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-emerald-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading contacts...</p>
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
            <p className="text-slate-400">Manage your trusted emergency contacts and their access permissions</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="permissions">Default Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6 mt-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search contacts..."
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="immediate_family">Immediate Family</SelectItem>
                  <SelectItem value="extended_family">Extended Family</SelectItem>
                  <SelectItem value="close_friends">Close Friends</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-emerald-400" />
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-200">Full Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-slate-200">Email *</Label>
                        <Input
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="john@example.com"
                          type="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-200">Phone Number</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-200">Relationship</Label>
                        <Input
                          value={formData.relationship}
                          onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Spouse, Parent, Friend, etc."
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-200">Contact Type</Label>
                        <Select 
                          value={formData.contact_type} 
                          onValueChange={(value: ContactType) => setFormData({...formData, contact_type: value})}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate_family">Immediate Family</SelectItem>
                            <SelectItem value="extended_family">Extended Family</SelectItem>
                            <SelectItem value="close_friends">Close Friends</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-200">Priority Order</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.priority_order}
                          onChange={(e) => setFormData({...formData, priority_order: parseInt(e.target.value) || 1})}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-200">Can Receive Messages</Label>
                        <p className="text-xs text-slate-400">Send emergency messages to this contact</p>
                      </div>
                      <Switch
                        checked={formData.can_receive_messages}
                        onCheckedChange={(checked) => setFormData({...formData, can_receive_messages: checked})}
                      />
                    </div>

                    <PermissionsConfig
                      permissions={formData.permissions}
                      onChange={(permissions) => setFormData({...formData, permissions})}
                      useTypeDefaults={formData.use_type_defaults}
                      onUseTypeDefaultsChange={(useDefaults) => setFormData({...formData, use_type_defaults: useDefaults})}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
                        {editingContact ? 'Update Contact' : 'Add Contact'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Contacts List */}
            <div className="grid gap-4">
              {filteredContacts.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No contacts found</h3>
                    <p className="text-slate-400 mb-4">
                      {searchTerm || filterType !== 'all' 
                        ? 'No contacts match your search criteria.' 
                        : 'Get started by adding your first emergency contact.'}
                    </p>
                    {(!searchTerm && filterType === 'all') && (
                      <Button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Contact
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredContacts.map((contact) => (
                  <Card key={contact.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-white">{contact.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {getContactTypeLabel(contact.contact_type)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Priority {contact.priority_order}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-white">{contact.email}</span>
                            </div>
                            
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-white">{contact.phone}</span>
                              </div>
                            )}
                            
                            {contact.relationship && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Relationship:</span>
                                <span className="text-white">{contact.relationship}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-slate-400">Access:</span>
                              <span className="text-slate-300 text-xs">
                                {getPermissionsSummary(contact)}
                              </span>
                            </div>
                            
                            <div className="flex gap-4 mt-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Messages:</span>
                                <Badge variant={contact.can_receive_messages ? "default" : "secondary"}>
                                  {contact.can_receive_messages ? 'Yes' : 'No'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-slate-400">Added:</span>
                              <span className="text-slate-300">
                                {new Date(contact.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6 mt-6">
            <ContactTypePermissions
              typePermissions={typePermissions}
              onUpdate={setTypePermissions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
