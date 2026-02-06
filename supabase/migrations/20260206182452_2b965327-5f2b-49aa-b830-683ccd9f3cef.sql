
-- Add email template customization fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_subject TEXT DEFAULT '🚨 Important: Message from {userName}''s Dead Man''s Switch',
ADD COLUMN IF NOT EXISTS email_header_title TEXT DEFAULT '🚨 Important Notification',
ADD COLUMN IF NOT EXISTS email_header_subtitle TEXT DEFAULT 'Dead Man''s Switch Activated',
ADD COLUMN IF NOT EXISTS email_intro_message TEXT DEFAULT 'This is an automated message from {userName}''s Dead Man''s Switch system. The system has been activated because they have not checked in within their specified timeframe, and the grace period has now expired.',
ADD COLUMN IF NOT EXISTS email_footer_message TEXT DEFAULT 'This is an automated message from the Dead Man''s Switch system. Please keep this information confidential and use it responsibly.',
ADD COLUMN IF NOT EXISTS email_grace_subject TEXT DEFAULT '⚠️ Grace Period Started - Check In Required',
ADD COLUMN IF NOT EXISTS email_grace_intro TEXT DEFAULT 'Your Dead Man''s Switch has detected that you did not check in by your scheduled deadline.';
