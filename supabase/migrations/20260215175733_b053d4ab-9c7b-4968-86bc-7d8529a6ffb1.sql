
-- Add setup wizard and test email tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_wizard_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_test_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add check-in method preferences to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS email_checkin_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_checkin_enabled BOOLEAN DEFAULT false;

-- Create check_in_tokens table for email/SMS check-in links
CREATE TABLE public.check_in_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  method TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.check_in_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-in tokens"
ON public.check_in_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-in tokens"
ON public.check_in_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create check_in_history table
CREATE TABLE public.check_in_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method TEXT NOT NULL DEFAULT 'web',
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.check_in_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-in history"
ON public.check_in_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-in history"
ON public.check_in_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage check_in_tokens (for edge functions)
CREATE POLICY "Service role can manage check-in tokens"
ON public.check_in_tokens FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage check-in history"
ON public.check_in_history FOR ALL
USING (true)
WITH CHECK (true);
