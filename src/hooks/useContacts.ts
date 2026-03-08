import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ContactsService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields, decryptFields } from '@/lib/crypto';
import { EmergencyContact, ContactPermissions, ContactType } from '@/types/access-control';

// Contact fields that get encrypted (email stays plaintext for notifications)
const ENCRYPTED_CONTACT_FIELDS = ['name', 'phone', 'relationship', 'notes', 'custom_message'];

export const useContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vaultKey } = useEncryption();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      const data = await ContactsService.getContacts(user.id);
      const transformedData: EmergencyContact[] = await Promise.all(data.map(async (contact) => {
        let decrypted = contact;
        if (vaultKey) {
          const decryptedValues = await decryptFields(contact, ENCRYPTED_CONTACT_FIELDS, vaultKey);
          decrypted = { ...contact, ...decryptedValues };
        }
        return {
          id: decrypted.id,
          name: decrypted.name,
          email: decrypted.email,
          phone: decrypted.phone || undefined,
          relationship: decrypted.relationship || undefined,
          contact_type: decrypted.contact_type as ContactType,
          priority_order: decrypted.priority_order,
          can_receive_messages: decrypted.can_receive_messages ?? true,
          permissions: (decrypted.permissions || {
            digital_accounts: { all_accounts: false, by_category: [], specific_accounts: [] },
            legacy_documents: { all_documents: false, by_category: [], specific_documents: [] },
            contact_information: false,
            emergency_instructions: false,
            can_modify_information: false,
          }) as unknown as ContactPermissions,
          use_type_defaults: decrypted.use_type_defaults ?? true,
          custom_message: decrypted.custom_message || null,
          created_at: decrypted.created_at,
        };
      }));
      setContacts(transformedData.sort((a, b) => (a.priority_order ?? 99) - (b.priority_order ?? 99)));
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
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    
    try {
      let contactData: any = { ...formData };

      if (vaultKey) {
        const fieldsToEncrypt: Record<string, string | null | undefined> = {
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
          notes: (formData as any).notes,
          custom_message: formData.custom_message,
        };
        const encrypted = await encryptFields(fieldsToEncrypt, vaultKey);
        contactData = { ...contactData, ...encrypted };
      }

      const newContact = await ContactsService.createContact(user.id, contactData);
      const transformedContact: EmergencyContact = {
        id: newContact.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        relationship: formData.relationship || undefined,
        contact_type: formData.contact_type,
        priority_order: formData.priority_order,
        can_receive_messages: formData.can_receive_messages ?? true,
        permissions: formData.permissions,
        use_type_defaults: formData.use_type_defaults ?? true,
        custom_message: formData.custom_message || null,
        created_at: newContact.created_at,
      };
      setContacts(prev => [...prev, transformedContact].sort((a, b) => (a.priority_order ?? 99) - (b.priority_order ?? 99)));
      
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
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving.", variant: "destructive" });
      return;
    }
    try {
      let contactData: any = { ...formData };

      if (vaultKey) {
        const fieldsToEncrypt: Record<string, string | null | undefined> = {
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
          notes: (formData as any).notes,
          custom_message: formData.custom_message,
        };
        const encrypted = await encryptFields(fieldsToEncrypt, vaultKey);
        contactData = { ...contactData, ...encrypted };
      }

      const updatedContact = await ContactsService.updateContact(contactId, contactData);
      const transformedContact: EmergencyContact = {
        id: updatedContact.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        relationship: formData.relationship || undefined,
        contact_type: formData.contact_type,
        priority_order: formData.priority_order,
        can_receive_messages: formData.can_receive_messages ?? true,
        permissions: formData.permissions,
        use_type_defaults: formData.use_type_defaults ?? true,
        custom_message: formData.custom_message || null,
        created_at: updatedContact.created_at,
      };
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? transformedContact : contact
      ).sort((a, b) => (a.priority_order ?? 99) - (b.priority_order ?? 99)));
      
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
  }, [user, vaultKey]);

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    updateContactPermissions,
    updateUseTypeDefaults,
    refetchContacts: fetchContacts,
  };
};
