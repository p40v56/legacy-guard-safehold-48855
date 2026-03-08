
CREATE OR REPLACE FUNCTION public.admin_get_triggered_switches()
 RETURNS TABLE(user_id uuid, switch_triggered_at timestamptz, grace_period_active boolean, grace_period_end timestamptz)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT us.user_id, us.switch_triggered_at, us.grace_period_active, us.grace_period_end
  FROM public.user_settings us
  WHERE us.switch_triggered = true
  ORDER BY us.switch_triggered_at DESC;
$$;
