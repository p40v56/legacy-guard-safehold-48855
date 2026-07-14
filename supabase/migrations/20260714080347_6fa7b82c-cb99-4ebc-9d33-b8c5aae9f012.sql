
ALTER TABLE public.sent_notifications
  ADD COLUMN IF NOT EXISTS trigger_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS sent_notifications_switch_trigger_unique
  ON public.sent_notifications (user_id, contact_id, notification_type, trigger_at)
  WHERE notification_type = 'switch_triggered' AND trigger_at IS NOT NULL;
