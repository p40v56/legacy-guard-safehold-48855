import { supabase } from '@/integrations/supabase/client';
import { DashboardStats, UserSettings, CheckInFrequency, DeadlineMode } from '@/types/common';

// Profile Service
export class ProfileService {
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProfile(userId: string, updates: { first_name?: string; last_name?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Settings Service
export class SettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    if (!data) {
      // Create default settings if none exist
      return await this.createDefaultSettings(userId);
    }
    
    return {
      check_in_frequency: data.check_in_frequency as CheckInFrequency,
      grace_period_hours: data.grace_period_hours,
      is_active: data.is_active,
      last_check_in: data.last_check_in,
      next_check_in_due: data.next_check_in_due,
      deadline_mode: data.deadline_mode as DeadlineMode,
      custom_deadline: data.custom_deadline,
    };
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings> {
    const defaultSettings = {
      user_id: userId,
      check_in_frequency: 'weekly' as CheckInFrequency,
      grace_period_hours: 24,
      is_active: false,
      last_check_in: null,
      next_check_in_due: null,
      deadline_mode: 'frequency' as DeadlineMode,
      custom_deadline: null,
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert([defaultSettings])
      .select()
      .single();
    
    if (error) throw error;

    return {
      check_in_frequency: data.check_in_frequency as CheckInFrequency,
      grace_period_hours: data.grace_period_hours,
      is_active: data.is_active,
      last_check_in: data.last_check_in,
      next_check_in_due: data.next_check_in_due,
      deadline_mode: data.deadline_mode as DeadlineMode,
      custom_deadline: data.custom_deadline,
    };
  }

  static async updateSettings(userId: string, settings: Partial<UserSettings>) {
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async checkIn(userId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_settings')
      .update({ 
        last_check_in: now,
        next_check_in_due: null // Will be calculated on next view
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Contacts Service
export class ContactsService {
  static async getContacts(userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createContact(userId: string, contact: any) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{ ...contact, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateContact(id: string, updates: any) {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteContact(id: string) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Accounts Service
export class AccountsService {
  static async getAccounts(userId: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createAccount(userId: string, account: any) {
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...account, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateAccount(id: string, updates: any) {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteAccount(id: string) {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Documents Service
export class DocumentsService {
  static async getDocuments(userId: string) {
    const { data, error } = await supabase
      .from('legacy_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createDocument(userId: string, document: any) {
    const { data, error } = await supabase
      .from('legacy_documents')
      .insert([{ ...document, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateDocument(id: string, updates: any) {
    const { data, error } = await supabase
      .from('legacy_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteDocument(id: string) {
    const { error } = await supabase
      .from('legacy_documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Dashboard Service
export class DashboardService {
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const [contacts, accounts, documents, userSettings] = await Promise.all([
        ContactsService.getContacts(userId),
        AccountsService.getAccounts(userId),
        DocumentsService.getDocuments(userId),
        SettingsService.getUserSettings(userId),
      ]);

      return {
        contactsCount: contacts.length,
        accountsCount: accounts.length,
        documentsCount: documents.length,
        userSettings,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}