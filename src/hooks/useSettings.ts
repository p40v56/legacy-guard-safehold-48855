import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  ProfileService, 
  SettingsService, 
  NotificationSettingsService, 
  ActivationRulesService,
  ContactTypePermissionsService 
} from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { ContactType } from '@/types/access-control';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  emergency_instructions?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  emergency_alerts: boolean;
}

interface ActivationRule {
  id: string;
  target_type: 'category' | 'contacts';
  contact_category?: ContactType;
  contact_ids?: string[];
  delay_hours: number;
  custom_message: string;
  enabled: boolean;
}

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    emergency_instructions: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    emergency_alerts: true
  });

  const [activationRules, setActivationRules] = useState<ActivationRule[]>([]);
  const [typePermissions, setTypePermissions] = useState<any[]>([]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const [profileData, notificationData, rulesData, permissionsData] = await Promise.all([
        ProfileService.getProfile(user.id),
        NotificationSettingsService.getNotificationSettings(user.id),
        ActivationRulesService.getActivationRules(user.id),
        ContactTypePermissionsService.getContactTypePermissions(user.id),
      ]);

      setProfile({
        id: profileData.id,
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: user.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        emergency_instructions: profileData.emergency_instructions || ''
      });

      setNotifications({
        email_notifications: notificationData.email_notifications,
        sms_notifications: notificationData.sms_notifications,
        emergency_alerts: notificationData.emergency_alerts
      });

      const transformedRules = rulesData.map(rule => ({
        id: rule.id,
        target_type: rule.target_type as 'category' | 'contacts',
        contact_category: rule.contact_category as ContactType,
        contact_ids: rule.contact_ids || [],
        delay_hours: rule.delay_hours,
        custom_message: rule.custom_message || '',
        enabled: rule.enabled
      }));
      setActivationRules(transformedRules);

      setTypePermissions(permissionsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await ProfileService.updateProfile(user.id, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        bio: profile.bio,
        emergency_instructions: profile.emergency_instructions,
      });
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!user) return;
    
    try {
      await NotificationSettingsService.updateNotificationSettings(user.id, notifications);
      toast({
        title: "Success",
        description: "Notification settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
    }
  };

  const saveActivationRules = async () => {
    if (!user) return;
    
    try {
      // Delete existing rules and recreate them
      // This is a simple approach - in production you might want to do differential updates
      const existingRules = await ActivationRulesService.getActivationRules(user.id);
      await Promise.all(existingRules.map(rule => ActivationRulesService.deleteActivationRule(rule.id)));
      
      // Create new rules
      await Promise.all(activationRules.map(rule => 
        ActivationRulesService.createActivationRule(user.id, {
          target_type: rule.target_type,
          contact_category: rule.contact_category,
          contact_ids: rule.contact_ids,
          delay_hours: rule.delay_hours,
          custom_message: rule.custom_message,
          enabled: rule.enabled
        })
      ));

      toast({
        title: "Success",
        description: "Activation rules updated successfully"
      });
    } catch (error) {
      console.error('Error updating activation rules:', error);
      toast({
        title: "Error",
        description: "Failed to update activation rules",
        variant: "destructive"
      });
    }
  };

  const addActivationRule = () => {
    const newRule: ActivationRule = {
      id: `temp-${Date.now()}`,
      target_type: 'category',
      contact_category: 'immediate_family',
      delay_hours: 0,
      custom_message: 'This is an automated message.',
      enabled: true
    };
    setActivationRules(prev => [...prev, newRule]);
  };

  const updateActivationRule = (id: string, updates: Partial<ActivationRule>) => {
    setActivationRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteActivationRule = (id: string) => {
    setActivationRules(prev => prev.filter(rule => rule.id !== id));
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  return {
    profile,
    setProfile,
    notifications,
    setNotifications,
    activationRules,
    setActivationRules,
    typePermissions,
    setTypePermissions,
    loading,
    saving,
    saveProfile,
    saveNotifications,
    saveActivationRules,
    addActivationRule,
    updateActivationRule,
    deleteActivationRule,
  };
};