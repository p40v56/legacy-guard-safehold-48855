-- Add missing fields to accounts table
ALTER TABLE public.accounts ADD COLUMN platform TEXT;
ALTER TABLE public.accounts ADD COLUMN email TEXT;
ALTER TABLE public.accounts ADD COLUMN importance TEXT;
ALTER TABLE public.accounts ADD COLUMN closure_action TEXT;

-- Add missing fields to contacts table
ALTER TABLE public.contacts ADD COLUMN can_receive_messages BOOLEAN DEFAULT TRUE;
ALTER TABLE public.contacts ADD COLUMN use_type_defaults BOOLEAN DEFAULT TRUE;

-- Add missing fields to activation_rules table
ALTER TABLE public.activation_rules ADD COLUMN target_type TEXT;
ALTER TABLE public.activation_rules ADD COLUMN contact_category TEXT;
ALTER TABLE public.activation_rules ADD COLUMN contact_ids TEXT[];
ALTER TABLE public.activation_rules ADD COLUMN custom_message TEXT;
ALTER TABLE public.activation_rules ADD COLUMN enabled BOOLEAN DEFAULT TRUE;

-- Add missing fields to legacy_documents table
ALTER TABLE public.legacy_documents ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.legacy_documents ADD COLUMN description TEXT;
ALTER TABLE public.legacy_documents ADD COLUMN file_type TEXT;
ALTER TABLE public.legacy_documents ADD COLUMN file_size INTEGER;