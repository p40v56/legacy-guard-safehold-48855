
-- Create table for contact access tokens (for the contact portal)
CREATE TABLE public.contact_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_access_tokens ENABLE ROW LEVEL SECURITY;

-- Owner can manage their tokens
CREATE POLICY "Users can view their own tokens"
ON public.contact_access_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tokens for their contacts"
ON public.contact_access_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.contact_access_tokens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.contact_access_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Add index for fast token lookups
CREATE INDEX idx_contact_access_tokens_token ON public.contact_access_tokens(token);
CREATE INDEX idx_contact_access_tokens_contact ON public.contact_access_tokens(contact_id);

-- Add custom_message field to contacts table for per-contact messages
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS custom_message TEXT;
