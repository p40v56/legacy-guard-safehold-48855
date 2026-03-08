import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ContactCard from '@/components/contacts/ContactCard';
import ContactDialog from '@/components/contacts/ContactDialog';
import ContactPermissionsDialog from '@/components/contacts/ContactPermissionsDialog';
import SearchInput from '@/components/ui/search-input';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Filter, Shield, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';
import { useContacts } from '@/hooks/useContacts';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { useEncryption } from '@/contexts/EncryptionContext';
import { createPortalShares } from '@/lib/portalShares';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Contacts = () => {
  const {
    contacts, loading, createContact, updateContact, deleteContact,
    updateContactPermissions, updateUseTypeDefaults, refetchContacts,
  } = useContacts();
  const { plan, limits, isPaid } = usePlan();
  const { user } = useAuth();
  const { vaultKey } = useEncryption();
  const { toast } = useToast();
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ContactType | 'all'>('all');
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedContactForPermissions, setSelectedContactForPermissions] = useState<EmergencyContact | null>(null);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const contactTypeLabels: Record<ContactType, string> = {
    immediate_family: 'Immediate Family',
    extended_family: 'Extended Family',
    close_friends: 'Close Friends',
    professional: 'Professional',
    legal: 'Legal',
    financial: 'Financial',
  };

  const getDefaultPermissions = (contactType: ContactType): ContactPermissions => ({
    digital_accounts: { all_accounts: false, by_category: [], specific_accounts: [] },
    financial_assets: { all_assets: false, by_category: [], specific_assets: [] },
    legacy_documents: { all_documents: false, by_category: [], specific_documents: [] },
    contact_information: false,
    emergency_instructions: false,
    can_modify_information: false,
  });

  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '', email: '', phone: '', relationship: '',
    contact_type: 'immediate_family', priority_order: 1,
    can_receive_messages: true, use_type_defaults: true,
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

  const isAtContactLimit = limits.maxContacts !== Infinity && contacts.length >= limits.maxContacts;

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) return;
    await createContact({
      name: newContact.name, email: newContact.email, phone: newContact.phone,
      relationship: newContact.relationship, contact_type: newContact.contact_type || 'immediate_family',
      priority_order: newContact.priority_order || 1, can_receive_messages: newContact.can_receive_messages ?? true,
      use_type_defaults: newContact.use_type_defaults ?? true,
      permissions: newContact.permissions || getDefaultPermissions('immediate_family'),
    });
    setNewContact({
      name: '', email: '', phone: '', relationship: '', contact_type: 'immediate_family',
      priority_order: 1, can_receive_messages: true, use_type_defaults: true,
      permissions: getDefaultPermissions('immediate_family')
    });
    setIsDialogOpen(false);
  };

  const handleEditContact = (contact: EmergencyContact) => { setEditingContact(contact); setIsEditDialogOpen(true); };

  const handleUpdateContact = async () => {
    if (!editingContact || !editingContact.name || !editingContact.email) return;
    await updateContact(editingContact.id, {
      name: editingContact.name, email: editingContact.email, phone: editingContact.phone,
      relationship: editingContact.relationship, contact_type: editingContact.contact_type,
      priority_order: editingContact.priority_order, can_receive_messages: editingContact.can_receive_messages,
      use_type_defaults: editingContact.use_type_defaults, permissions: editingContact.permissions,
    });
    setEditingContact(null); setIsEditDialogOpen(false);
  };

  const handleEditPermissions = (contact: EmergencyContact) => {
    setSelectedContactForPermissions(contact); setShowPermissionsDialog(true);
  };

  const handleSavePermissions = async (permissions: ContactPermissions) => {
    if (!selectedContactForPermissions) return;
    await updateContactPermissions(selectedContactForPermissions.id, permissions);
    setSelectedContactForPermissions(null);
  };

  const handleToggleExpand = (contactId: string) => {
    setExpandedContactId(prev => prev === contactId ? null : contactId);
  };

  const handleRegenerateAllPortalLinks = async () => {
    if (!user || !vaultKey) {
      toast({ title: 'Vault locked', description: 'Unlock your vault first.', variant: 'destructive' });
      return;
    }
    setRegeneratingAll(true);
    try {
      const { data: shares } = await supabase
        .from('contact_shares')
        .select('contact_id')
        .eq('user_id', user.id);
      const contactIdsWithShares = [...new Set((shares || []).map(s => s.contact_id))];
      if (contactIdsWithShares.length === 0) {
        toast({ title: 'No portal links', description: 'No existing portal links to regenerate.' });
        return;
      }
      let success = 0;
      for (const contactId of contactIdsWithShares) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('No session');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/contact-portal?action=generate-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ contactId }),
          });
          const result = await response.json();
          if (response.ok && result.token) {
            await createPortalShares(user.id, contactId, result.token, vaultKey);
            success++;
          }
        } catch (err) {
          console.error(`Failed to regenerate for ${contactId}:`, err);
        }
      }
      toast({ title: 'Portal links regenerated', description: `${success}/${contactIdsWithShares.length} links updated successfully.` });
    } catch (error) {
      console.error('Bulk regenerate error:', error);
      toast({ title: 'Error', description: 'Failed to regenerate portal links.', variant: 'destructive' });
    } finally {
      setRegeneratingAll(false);
    }
  };

  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => (a.priority_order ?? 99) - (b.priority_order ?? 99));
  }, [filteredContacts]);

  const handleReorder = async (contactId: string, direction: 'up' | 'down') => {
    const sorted = [...contacts].sort((a, b) => (a.priority_order ?? 99) - (b.priority_order ?? 99));
    const idx = sorted.findIndex(c => c.id === contactId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const current = sorted[idx];
    const swap = sorted[swapIdx];
    const currentOrder = current.priority_order ?? idx;
    const swapOrder = swap.priority_order ?? swapIdx;
    await Promise.all([
      supabase.from('contacts').update({ priority_order: swapOrder }).eq('id', current.id),
      supabase.from('contacts').update({ priority_order: currentOrder }).eq('id', swap.id),
    ]);
    // Optimistic local update via re-fetch pattern - contacts hook will pick up changes
    window.location.reload();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Contacts</h1>
            <p className="text-muted-foreground">Your trusted contacts</p>
          </div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-muted/30 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground mb-2">Emergency Contacts</h1>
            <p className="text-muted-foreground">Manage your trusted contacts for notifications</p>
          </div>
          {!isAtContactLimit ? (
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-lg shadow-primary/20">
                <UserPlus className="w-4 h-4 mr-2" />Add Contact
              </Button>
            </div>
          ) : null}
        </div>

        {isAtContactLimit && (
          <UpgradePrompt
            message={`Your plan is limited to ${limits.maxContacts} contact${limits.maxContacts === 1 ? '' : 's'}. Upgrade to add more contacts with individual permissions and portal access.`}
            featureKey="multipleContacts"
            requiredPlan={plan === 'essential' ? 'family' : 'essential'}
          />
        )}

        <div className="bg-muted/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search contacts..." className="bg-card/50 border-border" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={(value: ContactType | 'all') => setFilterCategory(value)}>
              <SelectTrigger className="w-48 bg-card/50 border-border rounded-xl"><SelectValue placeholder="Filter by category" /></SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                {Object.entries(contactTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="rounded-lg">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ContactDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} contactData={newContact} setContactData={setNewContact} onSubmit={handleCreateContact} contactTypeLabels={contactTypeLabels} isEditing={false} />

        {editingContact && (
          <ContactDialog isOpen={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingContact(null); }} contactData={editingContact} setContactData={(data) => setEditingContact({ ...editingContact, ...data } as EmergencyContact)} onSubmit={handleUpdateContact} contactTypeLabels={contactTypeLabels} isEditing={true} />
        )}

        {showPermissionsDialog && selectedContactForPermissions && (
          <ContactPermissionsDialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog} contactName={selectedContactForPermissions.name} permissions={selectedContactForPermissions.permissions} onSave={handleSavePermissions} />
        )}

        <div className="grid gap-2">
          {filteredContacts.length === 0 ? (
            <div className="bg-muted/30 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              {contacts.length === 0 ? (
                <>
                  <h3 className="text-xl font-medium text-card-foreground mb-2">No Emergency Contacts</h3>
                  <p className="text-muted-foreground mb-6">Start by adding your first emergency contact.</p>
                  <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 rounded-full px-6">
                    <UserPlus className="w-4 h-4 mr-2" />Add Your First Contact
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-card-foreground mb-2">No Contacts Found</h3>
                  <p className="text-muted-foreground mb-6">No contacts match your search criteria.</p>
                  <Button onClick={() => { setSearchQuery(''); setFilterCategory('all'); }} variant="outline" className="rounded-full">Clear Filters</Button>
                </>
              )}
            </div>
          ) : (
            sortedContacts.map((contact, idx) => (
              <div key={contact.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">#{idx + 1}</span>
                  <button
                    onClick={() => handleReorder(contact.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleReorder(contact.id, 'down')}
                    disabled={idx === sortedContacts.length - 1}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1">
                  <ContactCard
                    contact={contact}
                    contactTypeLabels={contactTypeLabels}
                    onEdit={handleEditContact}
                    onDelete={(id) => setDeleteTargetId(id)}
                    onPermissionsChange={updateContactPermissions}
                    onUseTypeDefaultsChange={updateUseTypeDefaults}
                    isExpanded={expandedContactId === contact.id}
                    onToggleExpand={() => handleToggleExpand(contact.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <ConfirmationDialog
          open={!!deleteTargetId}
          onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
          title="Delete Contact"
          description="Are you sure you want to delete this contact? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={() => { if (deleteTargetId) deleteContact(deleteTargetId); setDeleteTargetId(null); }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Contacts;
