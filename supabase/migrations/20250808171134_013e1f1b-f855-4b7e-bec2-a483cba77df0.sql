-- Update contacts table schema
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS priority_order integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS can_receive_messages boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"digital_accounts": {"by_category": [], "all_accounts": false, "specific_accounts": []}, "legacy_documents": {"by_category": [], "all_documents": false, "specific_documents": []}, "contact_information": false, "can_modify_information": false, "emergency_instructions": false}'::jsonb,
ADD COLUMN IF NOT EXISTS use_type_defaults boolean DEFAULT true;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS emergency_instructions text;

-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  emergency_alerts boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_settings
CREATE POLICY IF NOT EXISTS "Users can view their own notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create activation_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  target_type text NOT NULL,
  contact_category text,
  contact_ids uuid[],
  delay_hours integer DEFAULT 0,
  custom_message text,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on activation_rules
ALTER TABLE public.activation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for activation_rules
CREATE POLICY IF NOT EXISTS "Users can view their own activation rules" 
ON public.activation_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own activation rules" 
ON public.activation_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own activation rules" 
ON public.activation_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own activation rules" 
ON public.activation_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create contact_type_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_type_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contact_type text NOT NULL,
  default_permissions jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on contact_type_permissions
ALTER TABLE public.contact_type_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_type_permissions
CREATE POLICY IF NOT EXISTS "Users can view their own contact type permissions" 
ON public.contact_type_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own contact type permissions" 
ON public.contact_type_permissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own contact type permissions" 
ON public.contact_type_permissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own contact type permissions" 
ON public.contact_type_permissions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER IF NOT EXISTS update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_activation_rules_updated_at
BEFORE UPDATE ON public.activation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_contact_type_permissions_updated_at
BEFORE UPDATE ON public.contact_type_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();