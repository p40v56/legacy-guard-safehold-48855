ALTER TABLE public.financial_assets
  ADD COLUMN IF NOT EXISTS category_specific_fields_json TEXT,
  ADD COLUMN IF NOT EXISTS category_specific_fields_json_iv TEXT;