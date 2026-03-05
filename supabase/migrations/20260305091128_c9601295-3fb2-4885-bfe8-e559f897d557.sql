-- Schedule check-deadlines to run every hour via pg_cron + pg_net
SELECT cron.schedule(
  'check-deadlines-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aukkdhzrjglgiygsrrkz.supabase.co/functions/v1/check-deadlines',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.cron_secret', true), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- NOTE: To enable the CRON_SECRET security check:
-- 1. Set the secret as a database setting (run in SQL editor with superuser):
--    ALTER DATABASE postgres SET "app.settings.cron_secret" = 'your-secret-here';
-- 2. Set the same value as CRON_SECRET in Edge Function secrets.