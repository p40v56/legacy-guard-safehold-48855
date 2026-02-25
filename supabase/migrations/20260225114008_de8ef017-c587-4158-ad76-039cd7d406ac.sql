-- Function to safely return user emails from auth.users for admin use only
CREATE OR REPLACE FUNCTION public.admin_get_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT au.id as user_id, au.email
  FROM auth.users au
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
  ORDER BY au.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_emails() TO authenticated;