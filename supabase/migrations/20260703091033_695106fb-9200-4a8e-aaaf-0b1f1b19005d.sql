ALTER TABLE public.security_questions
  ADD COLUMN IF NOT EXISTS answer_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS answer_iv TEXT;