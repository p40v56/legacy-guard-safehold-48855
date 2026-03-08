import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackedSession {
  id: string;
  user_id: string;
  session_token_hash: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  is_mobile: boolean;
  last_active_at: string;
  created_at: string;
  is_current?: boolean;
}

function parseUserAgent(ua: string) {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  let isMobile = false;

  // OS detection
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) { os = 'Android'; isMobile = true; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { os = 'iOS'; isMobile = true; }
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'Chrome OS';

  // Browser detection
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  // Device
  if (/iPad/i.test(ua)) device = 'iPad';
  else if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/Android.*Mobile/i.test(ua)) device = 'Android Phone';
  else if (/Android/i.test(ua)) device = 'Android Tablet';
  else if (isMobile) device = 'Mobile';
  else device = `${os} Desktop`;

  return { browser, os, device, isMobile };
}

/** Generate a simple hash for session identification (not crypto-grade, just fingerprint) */
async function hashSessionToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export function useSessionTracker(userId?: string) {
  const [sessions, setSessions] = useState<TrackedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState<string | null>(null);

  // Track current session on mount
  useEffect(() => {
    if (!userId) return;

    const trackSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const hash = await hashSessionToken(session.access_token);
        setCurrentHash(hash);

        const ua = navigator.userAgent;
        const { browser, os, device, isMobile } = parseUserAgent(ua);

        // Upsert current session
        await (supabase as any).from('user_sessions').upsert({
          user_id: userId,
          session_token_hash: hash,
          browser,
          os,
          device_name: device,
          is_mobile: isMobile,
          last_active_at: new Date().toISOString(),
        }, { onConflict: 'user_id,session_token_hash' });

        // Clean up stale sessions (>30 days inactive)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await (supabase as any).from('user_sessions')
          .delete()
          .eq('user_id', userId)
          .lt('last_active_at', thirtyDaysAgo);

      } catch (e) {
        console.error('Session tracking error:', e);
      }
    };

    trackSession();
  }, [userId]);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (!error && data) {
        setSessions(data.map((s: TrackedSession) => ({
          ...s,
          is_current: s.session_token_hash === currentHash,
        })));
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, currentHash]);

  useEffect(() => {
    if (currentHash) fetchSessions();
  }, [currentHash, fetchSessions]);

  const revokeSession = useCallback(async (sessionId: string) => {
    await (supabase as any).from('user_sessions').delete().eq('id', sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  return { sessions, loading, revokeSession, refetch: fetchSessions };
}
