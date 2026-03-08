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
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create default profile if none exists
      return await this.createDefaultProfile(userId);
    }
    
    return data;
  }

  static async createDefaultProfile(userId: string) {
    const defaultProfile = {
      user_id: userId,
      first_name: '',
      last_name: '',
      phone: '',
      bio: '',
      emergency_instructions: '',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([defaultProfile])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProfile(userId: string, updates: any) {
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
    
    // Calculate next_check_in_due if not set and system is active
    let processedData = { ...data };
    if (data.is_active && data.deadline_mode === 'frequency' && !data.next_check_in_due && data.last_check_in) {
      const nextCheckIn = this.calculateNextCheckIn(data.check_in_frequency as CheckInFrequency, new Date(data.last_check_in));
      processedData.next_check_in_due = nextCheckIn;
      
      // Update the database with the calculated deadline
      await this.updateSettings(userId, { next_check_in_due: nextCheckIn });
    }
    
    return {
      check_in_frequency: processedData.check_in_frequency as CheckInFrequency,
      grace_period_hours: processedData.grace_period_hours,
      is_active: processedData.is_active,
      last_check_in: processedData.last_check_in,
      next_check_in_due: processedData.next_check_in_due,
      deadline_mode: processedData.deadline_mode as DeadlineMode,
      custom_deadline: processedData.custom_deadline,
      grace_period_active: processedData.grace_period_active ?? false,
      grace_period_end: processedData.grace_period_end,
      switch_triggered: processedData.switch_triggered ?? false,
      switch_triggered_at: processedData.switch_triggered_at,
    };
  }

  static calculateNextCheckIn(frequency: CheckInFrequency, fromDate: Date = new Date()): string {
    const nextDate = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    
    return nextDate.toISOString();
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
      grace_period_active: false,
      grace_period_end: null,
      switch_triggered: false,
      switch_triggered_at: null,
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
      grace_period_active: data.grace_period_active ?? false,
      grace_period_end: data.grace_period_end,
      switch_triggered: data.switch_triggered ?? false,
      switch_triggered_at: data.switch_triggered_at,
    };
  }

  static async updateSettings(userId: string, settings: Partial<UserSettings>) {
    // If switching to frequency mode, calculate next deadline
    if (settings.deadline_mode === 'frequency' && settings.check_in_frequency) {
      const currentSettings = await this.getUserSettings(userId);
      const lastCheckIn = currentSettings?.last_check_in || new Date().toISOString();
      settings.next_check_in_due = this.calculateNextCheckIn(settings.check_in_frequency, new Date(lastCheckIn));
      settings.custom_deadline = null; // Clear custom deadline when switching to frequency
    }
    
    // If setting custom deadline, clear next_check_in_due
    if (settings.deadline_mode === 'custom' && settings.custom_deadline) {
      settings.next_check_in_due = null;
    }

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
    
    // Get current settings to calculate next deadline
    const currentSettings = await this.getUserSettings(userId);
    let nextCheckInDue = null;
    
    if (currentSettings?.is_active && currentSettings.deadline_mode === 'frequency') {
      nextCheckInDue = this.calculateNextCheckIn(currentSettings.check_in_frequency, new Date(now));
    }
    
    // Reset grace period and switch triggered states on check-in
    const { data, error } = await supabase
      .from('user_settings')
      .update({ 
        last_check_in: now,
        next_check_in_due: nextCheckInDue,
        grace_period_active: false,
        grace_period_end: null,
        switch_triggered: false,
        switch_triggered_at: null,
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;

    // Record in check-in history
    await supabase
      .from('check_in_history')
      .insert({ user_id: userId, method: 'web', checked_in_at: now });

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
      .order('priority_order', { ascending: true });
    
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

// Notification Settings Service
export class NotificationSettingsService {
  static async getNotificationSettings(userId: string) {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create default settings if none exist
      return await this.createDefaultSettings(userId);
    }
    
    return data;
  }

  static async createDefaultSettings(userId: string) {
    const defaultSettings = {
      user_id: userId,
      email_notifications: true,
      sms_notifications: false,
      emergency_alerts: true,
    };

    const { data, error } = await supabase
      .from('notification_settings')
      .insert([defaultSettings])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateNotificationSettings(userId: string, settings: any) {
    const { data, error } = await supabase
      .from('notification_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Activation Rules Service
export class ActivationRulesService {
  static async getActivationRules(userId: string) {
    const { data, error } = await supabase
      .from('activation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('delay_hours', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async createActivationRule(userId: string, rule: any) {
    const { data, error } = await supabase
      .from('activation_rules')
      .insert([{ ...rule, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateActivationRule(id: string, updates: any) {
    const { data, error } = await supabase
      .from('activation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteActivationRule(id: string) {
    const { error } = await supabase
      .from('activation_rules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Contact Type Permissions Service
export class ContactTypePermissionsService {
  static async getContactTypePermissions(userId: string) {
    const { data, error } = await supabase
      .from('contact_type_permissions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  static async upsertContactTypePermission(userId: string, contactType: string, permissions: any) {
    const { data, error } = await supabase
      .from('contact_type_permissions')
      .upsert([{
        user_id: userId,
        contact_type: contactType,
        default_permissions: permissions
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
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