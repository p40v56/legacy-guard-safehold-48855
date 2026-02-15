import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ContactsService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';

export const useContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      const data = await ContactsService.getContacts(user.id);
      const transformedData: EmergencyContact[] = data.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || undefined,
        relationship: contact.relationship || undefined,
        contact_type: contact.contact_type as ContactType,
        priority_order: contact.priority_order,
        can_receive_messages: contact.can_receive_messages ?? true,
        permissions: (contact.permissions || {
          digital_accounts: { all_accounts: false, by_category: [], specific_accounts: [] },
          legacy_documents: { all_documents: false, by_category: [], specific_documents: [] },
          contact_information: false,
          emergency_instructions: false,
          can_modify_information: false,
        }) as unknown as ContactPermissions,
        use_type_defaults: contact.use_type_defaults ?? true,
        custom_message: contact.custom_message || null,
        created_at: contact.created_at,
      }));
      setContacts(transformedData);
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

  const createContact = async (formData: Omit<EmergencyContact, 'id' | 'created_at'>) => {
    if (!user) return;
    
    try {
      const newContact = await ContactsService.createContact(user.id, formData);
      const transformedContact: EmergencyContact = {
        id: newContact.id,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone || undefined,
        relationship: newContact.relationship || undefined,
        contact_type: newContact.contact_type as ContactType,
        priority_order: newContact.priority_order,
        can_receive_messages: newContact.can_receive_messages ?? true,
        permissions: (newContact.permissions || {}) as unknown as ContactPermissions,
        use_type_defaults: newContact.use_type_defaults ?? true,
        custom_message: newContact.custom_message || null,
        created_at: newContact.created_at,
      };
      setContacts(prev => [...prev, transformedContact]);
      
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const updateContact = async (contactId: string, formData: Omit<EmergencyContact, 'id' | 'created_at'>) => {
    try {
      const updatedContact = await ContactsService.updateContact(contactId, formData);
      const transformedContact: EmergencyContact = {
        id: updatedContact.id,
        name: updatedContact.name,
        email: updatedContact.email,
        phone: updatedContact.phone || undefined,
        relationship: updatedContact.relationship || undefined,
        contact_type: updatedContact.contact_type as ContactType,
        priority_order: updatedContact.priority_order,
        can_receive_messages: updatedContact.can_receive_messages ?? true,
        permissions: (updatedContact.permissions || {}) as unknown as ContactPermissions,
        use_type_defaults: updatedContact.use_type_defaults ?? true,
        custom_message: updatedContact.custom_message || null,
        created_at: updatedContact.created_at,
      };
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? transformedContact : contact
      ));
      
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await ContactsService.deleteContact(contactId);
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

  const updateContactPermissions = async (contactId: string, permissions: ContactPermissions) => {
    try {
      await ContactsService.updateContact(contactId, { permissions });
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, permissions } : contact
      ));
      toast({
        title: "Saved",
        description: "Permissions updated successfully",
      });
    } catch (error) {
      console.error('Error updating contact permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update contact permissions",
        variant: "destructive",
      });
    }
  };

  const updateUseTypeDefaults = async (contactId: string, useDefaults: boolean) => {
    try {
      await ContactsService.updateContact(contactId, { use_type_defaults: useDefaults });
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, use_type_defaults: useDefaults } : contact
      ));
    } catch (error) {
      console.error('Error updating contact defaults:', error);
      toast({
        title: "Error",
        description: "Failed to update contact settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    updateContactPermissions,
    updateUseTypeDefaults,
  };
};
