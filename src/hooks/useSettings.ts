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
import { EmailTemplateData } from '@/components/settings/EmailTemplateEditor';
import { useEncryption } from '@/contexts/EncryptionContext';
import { encryptFields, decryptFields } from '@/lib/crypto';

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
  target_type: 'all' | 'category' | 'contacts';
  contact_category?: ContactType;
  contact_ids?: string[];
  delay_hours: number;
  custom_message: string;
  enabled: boolean;
}

const defaultEmailTemplate: EmailTemplateData = {
  email_subject: "🚨 Important: Message from {userName}'s Dead Man's Switch",
  email_header_title: '🚨 Important Notification',
  email_header_subtitle: "Dead Man's Switch Activated",
  email_intro_message: "This is an automated message from {userName}'s Dead Man's Switch system. The system has been activated because they have not checked in within their specified timeframe, and the grace period has now expired.",
  email_footer_message: "This is an automated message from the Dead Man's Switch system. Please keep this information confidential and use it responsibly.",
  email_grace_subject: '⚠️ Grace Period Started - Check In Required',
  email_grace_intro: "Your Dead Man's Switch has detected that you did not check in by your scheduled deadline.",
};

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vaultKey } = useEncryption();
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
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplateData>(defaultEmailTemplate);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const [profileData, notificationData, rulesData, permissionsData] = await Promise.all([
        ProfileService.getProfile(user.id),
        NotificationSettingsService.getNotificationSettings(user.id),
        ActivationRulesService.getActivationRules(user.id),
        ContactTypePermissionsService.getContactTypePermissions(user.id),
      ]);

      // Decrypt first_name and last_name if vault is unlocked
      let firstName = profileData.first_name || '';
      let lastName = profileData.last_name || '';
      if (vaultKey) {
        try {
          const decrypted = await decryptFields(profileData as any, ['first_name', 'last_name'], vaultKey);
          firstName = decrypted.first_name || firstName;
          lastName = decrypted.last_name || lastName;
        } catch { /* use raw */ }
      }

      // Decrypt emergency_instructions if vault is unlocked
      let emergencyInstructions = profileData.emergency_instructions || '';
      if (vaultKey && (profileData as any).emergency_instructions_iv) {
        try {
          const decrypted = await decryptFields(profileData as any, ['emergency_instructions'], vaultKey);
          emergencyInstructions = decrypted.emergency_instructions || emergencyInstructions;
        } catch { /* use raw */ }
      }

      setProfile({
        id: profileData.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        emergency_instructions: emergencyInstructions
      });

      // Load email template from profile data
      setEmailTemplate({
        email_subject: (profileData as any).email_subject || defaultEmailTemplate.email_subject,
        email_header_title: (profileData as any).email_header_title || defaultEmailTemplate.email_header_title,
        email_header_subtitle: (profileData as any).email_header_subtitle || defaultEmailTemplate.email_header_subtitle,
        email_intro_message: (profileData as any).email_intro_message || defaultEmailTemplate.email_intro_message,
        email_footer_message: (profileData as any).email_footer_message || defaultEmailTemplate.email_footer_message,
        email_grace_subject: (profileData as any).email_grace_subject || defaultEmailTemplate.email_grace_subject,
        email_grace_intro: (profileData as any).email_grace_intro || defaultEmailTemplate.email_grace_intro,
      });

      setNotifications({
        email_notifications: notificationData.email_notifications,
        sms_notifications: notificationData.sms_notifications,
        emergency_alerts: notificationData.emergency_alerts
      });

      const transformedRules = await Promise.all(rulesData.map(async (rule) => {
        let customMessage = rule.custom_message || '';
        if (vaultKey && customMessage && rule.custom_message_iv) {
          try {
            const decrypted = await decryptFields(rule as any, ['custom_message'], vaultKey);
            customMessage = decrypted.custom_message || customMessage;
          } catch { /* use raw */ }
        }
        return {
          id: rule.id,
          target_type: rule.target_type as 'category' | 'contacts',
          contact_category: rule.contact_category as ContactType,
          contact_ids: rule.contact_ids || [],
          delay_hours: rule.delay_hours,
          custom_message: customMessage,
          enabled: rule.enabled,
        };
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
    
    if (!vaultKey) {
      toast({
        title: "Vault Locked",
        description: "Your vault must be unlocked to save profile changes.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let profileUpdate: any = {
        phone: profile.phone,
        bio: profile.bio,
      };

      const encrypted = await encryptFields({
        first_name: profile.first_name,
        last_name: profile.last_name,
        emergency_instructions: profile.emergency_instructions,
      }, vaultKey);
      profileUpdate = { ...profileUpdate, ...encrypted };

      await ProfileService.updateProfile(user.id, profileUpdate);
      
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

  // Email template fields are intentionally stored as plaintext in the profiles table.
  // The edge function (send-notification) needs to read them server-side to build emails,
  // and it has no access to the user's vault key. This is an accepted exception to the
  // E2E encryption policy — these fields contain formatting preferences, not sensitive PII.
  const saveEmailTemplate = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await ProfileService.updateProfile(user.id, {
        email_subject: emailTemplate.email_subject,
        email_header_title: emailTemplate.email_header_title,
        email_header_subtitle: emailTemplate.email_header_subtitle,
        email_intro_message: emailTemplate.email_intro_message,
        email_footer_message: emailTemplate.email_footer_message,
        email_grace_subject: emailTemplate.email_grace_subject,
        email_grace_intro: emailTemplate.email_grace_intro,
      });
      
      toast({
        title: "Success",
        description: "Email templates updated successfully"
      });
    } catch (error) {
      console.error('Error updating email templates:', error);
      toast({
        title: "Error",
        description: "Failed to update email templates",
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

  const saveTypePermissions = async (updatedPermissions: any[]) => {
    if (!user) return;
    
    try {
      await Promise.all(updatedPermissions.map((tp: any) =>
        ContactTypePermissionsService.upsertContactTypePermission(
          user.id,
          tp.contact_type,
          tp.default_permissions
        )
      ));
      setTypePermissions(updatedPermissions);
      toast({
        title: "Success",
        description: "Default permissions updated successfully"
      });
    } catch (error) {
      console.error('Error saving type permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save default permissions",
        variant: "destructive"
      });
    }
  };

  const saveActivationRules = async () => {
    if (!user) return;
    if (!vaultKey) {
      toast({ title: "Vault Locked", description: "Please unlock your vault before saving activation rules.", variant: "destructive" });
      return;
    }
    
    try {
      const existingRules = await ActivationRulesService.getActivationRules(user.id);
      await Promise.all(existingRules.map(rule => ActivationRulesService.deleteActivationRule(rule.id)));
      
      await Promise.all(activationRules.map(async (rule) => {
        let ruleData: any = {
          target_type: rule.target_type,
          contact_category: rule.contact_category,
          contact_ids: rule.contact_ids,
          delay_hours: rule.delay_hours,
          custom_message: rule.custom_message,
          enabled: rule.enabled,
          action_type: 'send_message',
        };

        if (vaultKey && rule.custom_message) {
          const encrypted = await encryptFields({ custom_message: rule.custom_message }, vaultKey);
          ruleData = { ...ruleData, ...encrypted };
        }

        return ActivationRulesService.createActivationRule(user.id, ruleData);
      }));

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
      target_type: 'all',
      delay_hours: 0,
      custom_message: '',
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
  }, [user, vaultKey]);

  return {
    profile,
    setProfile,
    notifications,
    setNotifications,
    activationRules,
    setActivationRules,
    typePermissions,
    setTypePermissions,
    emailTemplate,
    setEmailTemplate,
    loading,
    saving,
    saveProfile,
    saveNotifications,
    saveActivationRules,
    saveTypePermissions,
    saveEmailTemplate,
    addActivationRule,
    updateActivationRule,
    deleteActivationRule,
  };
};
