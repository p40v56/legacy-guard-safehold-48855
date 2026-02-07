import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !editingContact.name || !editingContact.email) return;
    
    await updateContact(editingContact.id, {
      name: editingContact.name,
      email: editingContact.email,
      phone: editingContact.phone,
      relationship: editingContact.relationship,
      contact_type: editingContact.contact_type,
      priority_order: editingContact.priority_order,
      can_receive_messages: editingContact.can_receive_messages,
      use_type_defaults: editingContact.use_type_defaults,
      permissions: editingContact.permissions,
    });
    
    setEditingContact(null);
    setIsEditDialogOpen(false);
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
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Emergency Contacts</h1>
            <p className="text-muted-foreground">
              Manage your trusted contacts for notifications
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-muted/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search contacts..."
              className="bg-card/50 border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={(value: ContactType | 'all') => setFilterCategory(value)}>
              <SelectTrigger className="w-48 bg-card/50 border-border rounded-xl">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                {Object.entries(contactTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="rounded-lg">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create Contact Dialog */}
        <ContactDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          contactData={newContact}
          setContactData={setNewContact}
          onSubmit={handleCreateContact}
          contactTypeLabels={contactTypeLabels}
          isEditing={false}
        />

        {/* Edit Contact Dialog */}
        {editingContact && (
          <ContactDialog
            isOpen={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingContact(null);
            }}
            contactData={editingContact}
            setContactData={(data) => setEditingContact({ ...editingContact, ...data } as EmergencyContact)}
            onSubmit={handleUpdateContact}
            contactTypeLabels={contactTypeLabels}
            isEditing={true}
          />
        )}

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
            <div className="bg-muted/30 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              {contacts.length === 0 ? (
                <>
                  <h3 className="text-xl font-medium text-card-foreground mb-2">No Emergency Contacts</h3>
                  <p className="text-muted-foreground mb-6">
                    Start by adding your first emergency contact.
                  </p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 rounded-full px-6"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Contact
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-card-foreground mb-2">No Contacts Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No contacts match your search criteria.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('all');
                    }}
                    variant="outline"
                    className="rounded-full"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                contactTypeLabels={contactTypeLabels}
                onEdit={handleEditContact}
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
