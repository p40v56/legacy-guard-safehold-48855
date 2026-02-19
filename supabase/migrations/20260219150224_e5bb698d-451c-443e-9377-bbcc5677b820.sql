
-- Add encryption key storage to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salt text,
  ADD COLUMN IF NOT EXISTS encrypted_vault_key text,
  ADD COLUMN IF NOT EXISTS vault_key_iv text;

-- Add IV columns to accounts (account_name, username, credentials, website_url, notes, email, platform stay as ciphertext in existing columns)
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS account_name_iv text,
  ADD COLUMN IF NOT EXISTS username_iv text,
  ADD COLUMN IF NOT EXISTS credentials_iv text,
  ADD COLUMN IF NOT EXISTS website_url_iv text,
  ADD COLUMN IF NOT EXISTS notes_iv text,
  ADD COLUMN IF NOT EXISTS email_iv text,
  ADD COLUMN IF NOT EXISTS platform_iv text;

-- Add IV columns to contacts (name/email stay plaintext for notifications; encrypt phone, relationship, notes, custom_message)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS phone_iv text,
  ADD COLUMN IF NOT EXISTS relationship_iv text,
  ADD COLUMN IF NOT EXISTS notes_iv text,
  ADD COLUMN IF NOT EXISTS custom_message_iv text;

-- Add IV columns to legacy_documents (title, description, content encrypted)
ALTER TABLE public.legacy_documents
  ADD COLUMN IF NOT EXISTS title_iv text,
  ADD COLUMN IF NOT EXISTS description_iv text,
  ADD COLUMN IF NOT EXISTS content_iv text,
  ADD COLUMN IF NOT EXISTS file_iv text;

-- Add IV columns to financial_assets (name, institution, reference_number, notes, contact_name, contact_phone, contact_email encrypted)
ALTER TABLE public.financial_assets
  ADD COLUMN IF NOT EXISTS name_iv text,
  ADD COLUMN IF NOT EXISTS institution_iv text,
  ADD COLUMN IF NOT EXISTS reference_number_iv text,
  ADD COLUMN IF NOT EXISTS notes_iv text,
  ADD COLUMN IF NOT EXISTS contact_name_iv text,
  ADD COLUMN IF NOT EXISTS contact_phone_iv text,
  ADD COLUMN IF NOT EXISTS contact_email_iv text;

-- Add IV columns to activation_rules (custom_message encrypted)
ALTER TABLE public.activation_rules
  ADD COLUMN IF NOT EXISTS custom_message_iv text;

-- Create contact_shares table for secure portal sharing
CREATE TABLE IF NOT EXISTS public.contact_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.legacy_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  encrypted_content text,
  content_iv text,
  encrypted_share_key text,
  share_key_iv text,
  access_token_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contact shares"
  ON public.contact_shares
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow public read by access_token_hash for portal access (no auth needed)
CREATE POLICY "Portal access via token hash"
  ON public.contact_shares
  FOR SELECT
  USING (access_token_hash IS NOT NULL);
