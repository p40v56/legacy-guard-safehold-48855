
-- Create financial_assets table
CREATE TABLE public.financial_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  institution TEXT,
  estimated_value DECIMAL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  reference_number TEXT,
  notes TEXT,
  category_specific_fields JSONB DEFAULT '{}'::jsonb,
  visible_to UUID[],
  attached_document_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own financial assets"
  ON public.financial_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial assets"
  ON public.financial_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial assets"
  ON public.financial_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial assets"
  ON public.financial_assets FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_financial_assets_updated_at
  BEFORE UPDATE ON public.financial_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
