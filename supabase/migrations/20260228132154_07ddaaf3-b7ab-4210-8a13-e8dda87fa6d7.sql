CREATE OR REPLACE FUNCTION public.admin_get_user_emails(row_limit int DEFAULT 500)
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
  ORDER BY au.created_at DESC
  LIMIT row_limit;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_emails(int) TO authenticated;