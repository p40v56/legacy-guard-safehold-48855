-- Add grace_period_active and grace_period_end columns to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS grace_period_active BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS switch_triggered BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS switch_triggered_at TIMESTAMP WITH TIME ZONE NULL;

-- Add notification_type to sent_notifications for tracking different types
COMMENT ON COLUMN public.sent_notifications.notification_type IS 'Types: deadline_warning (grace period started), deadline_expired (switch triggered), test';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_grace_period ON public.user_settings(grace_period_active, grace_period_end);
CREATE INDEX IF NOT EXISTS idx_user_settings_switch_triggered ON public.user_settings(switch_triggered);