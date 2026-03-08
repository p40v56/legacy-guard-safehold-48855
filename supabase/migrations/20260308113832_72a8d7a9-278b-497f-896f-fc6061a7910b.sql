
-- Update existing 'paid' records to 'essential' for consistency
UPDATE public.profiles SET plan = 'essential' WHERE plan = 'paid';

-- Drop existing constraint if any
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Add check constraint for valid plan values (using trigger instead of CHECK for compatibility)
CREATE OR REPLACE FUNCTION public.validate_plan_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.plan NOT IN ('free', 'essential', 'family') THEN
    RAISE EXCEPTION 'Invalid plan value: %. Must be free, essential, or family.', NEW.plan;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_plan_trigger ON public.profiles;
CREATE TRIGGER validate_plan_trigger
  BEFORE INSERT OR UPDATE OF plan ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_plan_value();
