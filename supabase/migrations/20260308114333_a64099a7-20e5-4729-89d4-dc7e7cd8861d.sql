
CREATE OR REPLACE FUNCTION public.admin_get_stats()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'free_users', (SELECT count(*) FROM public.profiles WHERE plan = 'free'),
    'paid_users', (SELECT count(*) FROM public.profiles WHERE plan IN ('essential', 'family')),
    'essential_users', (SELECT count(*) FROM public.profiles WHERE plan = 'essential'),
    'family_users', (SELECT count(*) FROM public.profiles WHERE plan = 'family'),
    'active_switches', (SELECT count(*) FROM public.user_settings WHERE is_active = true),
    'checked_in_today', (SELECT count(DISTINCT user_id) FROM public.check_in_history WHERE checked_in_at >= CURRENT_DATE)
  );
$$;
