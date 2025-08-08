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