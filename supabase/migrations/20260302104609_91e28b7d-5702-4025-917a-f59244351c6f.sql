-- Drop the old zero-argument overload to avoid ambiguity
DROP FUNCTION IF EXISTS public.admin_get_user_emails();