-- Update contacts table to match UI requirements
ALTER TABLE public.contacts 
ADD COLUMN priority_order INTEGER DEFAULT 1,
ADD COLUMN can_receive_messages BOOLEAN DEFAULT true,
ADD COLUMN permissions JSONB DEFAULT '{"digital_accounts": {"all_accounts": false, "by_category": [], "specific_accounts": []}, "legacy_documents": {"all_documents": false, "by_category": [], "specific_documents": []}, "contact_information": false, "emergency_instructions": false, "can_modify_information": false}',
ADD COLUMN use_type_defaults BOOLEAN DEFAULT true;

-- Remove the is_primary column as it's not used in the UI
ALTER TABLE public.contacts DROP COLUMN is_primary;

-- Update contact_type default to match UI expectations
ALTER TABLE public.contacts ALTER COLUMN contact_type SET DEFAULT 'immediate_family';

-- Create profiles table to store additional user information  
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,
  emergency_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for profiles timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  emergency_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_settings
CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for notification_settings timestamp updates
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create activation_rules table for Dead Man's Switch configuration
CREATE TABLE public.activation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('category', 'contacts')),
  contact_category TEXT CHECK (contact_category IN ('immediate_family', 'extended_family', 'close_friends', 'professional', 'legal', 'financial')),
  contact_ids UUID[],
  delay_hours INTEGER DEFAULT 0,
  custom_message TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activation_rules
ALTER TABLE public.activation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for activation_rules
CREATE POLICY "Users can view their own activation rules" 
ON public.activation_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activation rules" 
ON public.activation_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activation rules" 
ON public.activation_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activation rules" 
ON public.activation_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for activation_rules timestamp updates
CREATE TRIGGER update_activation_rules_updated_at
BEFORE UPDATE ON public.activation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact_type_permissions table for default permissions by contact type
CREATE TABLE public.contact_type_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('immediate_family', 'extended_family', 'close_friends', 'professional', 'legal', 'financial')),
  default_permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_type)
);

-- Enable RLS on contact_type_permissions
ALTER TABLE public.contact_type_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_type_permissions
CREATE POLICY "Users can view their own contact type permissions" 
ON public.contact_type_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact type permissions" 
ON public.contact_type_permissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact type permissions" 
ON public.contact_type_permissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact type permissions" 
ON public.contact_type_permissions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for contact_type_permissions timestamp updates
CREATE TRIGGER update_contact_type_permissions_updated_at
BEFORE UPDATE ON public.contact_type_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();