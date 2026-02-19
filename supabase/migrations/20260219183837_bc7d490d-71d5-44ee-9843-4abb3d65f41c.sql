-- Add IV columns for contact name encryption
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS name_iv text;

-- Add IV columns for profile name encryption
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name_iv text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name_iv text;