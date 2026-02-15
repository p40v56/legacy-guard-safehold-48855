
-- Add plan and deactivated columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deactivated boolean NOT NULL DEFAULT false;

-- Create user_roles table (per security instructions - separate from profiles)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin function to list all profiles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles ORDER BY created_at DESC;
$$;

-- Admin function to update any profile (bypasses RLS)  
CREATE OR REPLACE FUNCTION public.admin_update_profile(_profile_user_id uuid, _updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    plan = COALESCE(_updates->>'plan', plan),
    plan_expires_at = CASE 
      WHEN _updates ? 'plan_expires_at' THEN (_updates->>'plan_expires_at')::timestamptz
      ELSE plan_expires_at
    END,
    deactivated = CASE
      WHEN _updates ? 'deactivated' THEN (_updates->>'deactivated')::boolean
      ELSE deactivated
    END,
    updated_at = now()
  WHERE user_id = _profile_user_id;
END;
$$;

-- Admin function to get user count stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'free_users', (SELECT count(*) FROM public.profiles WHERE plan = 'free'),
    'paid_users', (SELECT count(*) FROM public.profiles WHERE plan = 'paid'),
    'active_switches', (SELECT count(*) FROM public.user_settings WHERE is_active = true),
    'checked_in_today', (SELECT count(DISTINCT user_id) FROM public.check_in_history WHERE checked_in_at >= CURRENT_DATE)
  );
$$;
