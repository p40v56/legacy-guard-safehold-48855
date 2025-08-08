import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ContactCard from '@/components/contacts/ContactCard';
import ContactDialog from '@/components/contacts/ContactDialog';
import ContactPermissionsDialog from '@/components/contacts/ContactPermissionsDialog';
import SearchInput from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Filter, Shield } from 'lucide-react';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';
import { useContacts } from '@/hooks/useContacts';

const Contacts = () => {
  const {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    updateContactPermissions,
    updateUseTypeDefaults,
  } = useContacts();
  
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ContactType | 'all'>('all');
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedContactForPermissions, setSelectedContactForPermissions] = useState<EmergencyContact | null>(null);

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

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.relationship?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || contact.contact_type === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [contacts, searchQuery, filterCategory]);

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) return;
    
    await createContact({
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      relationship: newContact.relationship,
      contact_type: newContact.contact_type || 'immediate_family',
      priority_order: newContact.priority_order || 1,
      can_receive_messages: newContact.can_receive_messages ?? true,
      use_type_defaults: newContact.use_type_defaults ?? true,
      permissions: newContact.permissions || getDefaultPermissions('immediate_family'),
    });
    
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
  };

  const handleEditPermissions = (contact: EmergencyContact) => {
    setSelectedContactForPermissions(contact);
    setShowPermissionsDialog(true);
  };

  const handleSavePermissions = async (permissions: ContactPermissions) => {
    if (!selectedContactForPermissions) return;
    
    await updateContactPermissions(selectedContactForPermissions.id, permissions);
    setSelectedContactForPermissions(null);
  };

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
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search contacts by name, email, or relationship..."
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterCategory} onValueChange={(value: ContactType | 'all') => setFilterCategory(value)}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all" className="text-white hover:bg-slate-600">All Categories</SelectItem>
                {Object.entries(contactTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-slate-600">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ContactDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          contactData={newContact}
          setContactData={setNewContact}
          onSubmit={handleCreateContact}
          contactTypeLabels={contactTypeLabels}
          isEditing={false}
        />

        {showPermissionsDialog && selectedContactForPermissions && (
          <ContactPermissionsDialog
            open={showPermissionsDialog}
            onOpenChange={setShowPermissionsDialog}
            contactName={selectedContactForPermissions.name}
            permissions={selectedContactForPermissions.permissions}
            onSave={handleSavePermissions}
          />
        )}

        {/* Contacts List */}
        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-slate-400 mb-4" />
                {contacts.length === 0 ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">No Contacts Found</h3>
                    <p className="text-slate-400 text-center mb-4">
                      No contacts match your search criteria. Try adjusting your search or filter.
                    </p>
                    <Button 
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                      }}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Clear Filters
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                contactTypeLabels={contactTypeLabels}
                onEdit={setEditingContact}
                onDelete={deleteContact}
                onPermissionsChange={updateContactPermissions}
                onUseTypeDefaultsChange={updateUseTypeDefaults}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
