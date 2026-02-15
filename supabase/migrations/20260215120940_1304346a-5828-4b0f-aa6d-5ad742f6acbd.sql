
-- Create security questions table for portal authentication
CREATE TABLE public.security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'category', 'contact')),
  target_contact_type TEXT,
  target_contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own security questions"
ON public.security_questions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security questions"
ON public.security_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security questions"
ON public.security_questions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own security questions"
ON public.security_questions FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_security_questions_updated_at
BEFORE UPDATE ON public.security_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
