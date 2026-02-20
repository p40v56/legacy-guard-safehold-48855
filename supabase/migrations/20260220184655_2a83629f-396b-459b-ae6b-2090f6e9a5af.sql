
-- Add shared_document_ids to contact_shares for document access verification
ALTER TABLE public.contact_shares ADD COLUMN IF NOT EXISTS shared_document_ids text[] DEFAULT '{}';
