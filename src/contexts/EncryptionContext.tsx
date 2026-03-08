import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  deriveMasterKey,
  generateSalt,
  generateVaultKey,
  encryptVaultKey,
  decryptVaultKey,
} from '@/lib/crypto';
import { migrateUserData } from '@/lib/dataMigration';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck } from 'lucide-react';

const getAutoLockMs = () => {
  const stored = localStorage.getItem('vault_auto_lock_minutes');
  const minutes = stored ? parseInt(stored) : 15;
  return minutes * 60 * 1000;
};

interface EncryptionContextType {
  vaultKey: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (password: string, userId: string) => Promise<boolean>;
  lock: () => void;
  /** Setup encryption for a brand new user (signup flow) */
  setupNewUser: (password: string, userId: string) => Promise<boolean>;
  /** Re-wrap vault key after password change */
  rewrapVaultKey: (newPassword: string, userId: string) => Promise<boolean>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export const useEncryption = () => {
  const ctx = useContext(EncryptionContext);
  if (!ctx) throw new Error('useEncryption must be used within EncryptionProvider');
  return ctx;
};

export const EncryptionProvider = ({ children }: { children: ReactNode }) => {
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState('');
  const lastActivityRef = useRef(Date.now());
  const tabHiddenAtRef = useRef<number | null>(null);
  const userIdRef = useRef<string | null>(null);
  const unlockingRef = useRef(false);

  const isUnlocked = vaultKey !== null;

  const lock = useCallback(() => {
    setVaultKey(null);
    // Don't show reauth if no user is logged in
    if (userIdRef.current) {
      setShowReauth(true);
    }
  }, []);

  const unlock = useCallback(async (password: string, userId: string): Promise<boolean> => {
    try {
      // Fetch profile for salt + encrypted vault key
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('salt, encrypted_vault_key, vault_key_iv')
        .eq('user_id', userId)
        .single();

      if (error || !profile) return false;

      // If no encryption set up yet, this is likely a pre-encryption user
      if (!profile.salt || !profile.encrypted_vault_key || !profile.vault_key_iv) {
        // Auto-setup encryption for existing users on first login after migration
        return await setupNewUser(password, userId);
      }

      const masterKey = await deriveMasterKey(password, profile.salt);
      const decryptedVaultKey = await decryptVaultKey(
        profile.encrypted_vault_key,
        profile.vault_key_iv,
        masterKey
      );

      setVaultKey(decryptedVaultKey);
      userIdRef.current = userId;
      lastActivityRef.current = Date.now();
      setShowReauth(false);
      setReauthPassword('');
      setReauthError('');

      // Auto-migrate plaintext data on first unlock (skip if already done)
      try {
        const { data: migrationCheck } = await supabase
          .from('profiles')
          .select('migration_complete')
          .eq('user_id', userId)
          .single();

        if (!migrationCheck?.migration_complete) {
          const result = await migrateUserData(userId, decryptedVaultKey);
          if (result.total > 0) {
            // Migration complete — records encrypted
          }
          await supabase
            .from('profiles')
            .update({ migration_complete: true } as any)
            .eq('user_id', userId);
        }
      } catch (e) {
        console.error('Data migration error:', e);
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const setupNewUser = useCallback(async (password: string, userId: string): Promise<boolean> => {
    try {
      const salt = generateSalt();
      const masterKey = await deriveMasterKey(password, salt);
      const newVaultKey = await generateVaultKey();
      const { encryptedVaultKey, vaultKeyIv } = await encryptVaultKey(newVaultKey, masterKey);

      const { error } = await supabase
        .from('profiles')
        .update({
          salt,
          encrypted_vault_key: encryptedVaultKey,
          vault_key_iv: vaultKeyIv,
        } as any)
        .eq('user_id', userId);

      if (error) return false;

      setVaultKey(newVaultKey);
      userIdRef.current = userId;
      lastActivityRef.current = Date.now();

      // Send welcome email (non-blocking)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
            body: JSON.stringify({
              notificationType: 'welcome',
              recipientEmail: user.email,
              appUrl: window.location.origin,
            }),
          });
        }
      } catch { /* non-blocking */ }

      return true;
    } catch {
      return false;
    }
  }, []);

  const rewrapVaultKey = useCallback(async (newPassword: string, userId: string): Promise<boolean> => {
    if (!vaultKey) return false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('salt')
        .eq('user_id', userId)
        .single();

      if (!profile?.salt) return false;

      const newMasterKey = await deriveMasterKey(newPassword, profile.salt);
      const { encryptedVaultKey, vaultKeyIv } = await encryptVaultKey(vaultKey, newMasterKey);

      const { error } = await supabase
        .from('profiles')
        .update({
          encrypted_vault_key: encryptedVaultKey,
          vault_key_iv: vaultKeyIv,
        } as any)
        .eq('user_id', userId);

      return !error;
    } catch {
      return false;
    }
  }, [vaultKey]);

  // Auto-lock on inactivity
  useEffect(() => {
    if (!isUnlocked) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivityRef.current > getAutoLockMs()) {
        lock();
      }
    }, 30_000);

    const handleVisibility = () => {
      if (document.hidden) {
        // Record the moment we left, so the inactivity timer
        // starts from tab-hide, not from last interaction before hide
        tabHiddenAtRef.current = Date.now();
        return;
      }
      // On tab return, measure time away from the tab-hide moment
      const hiddenAt = tabHiddenAtRef.current || lastActivityRef.current;
      if (Date.now() - hiddenAt > getAutoLockMs()) {
        lock();
      } else {
        // Reset activity so the user isn't immediately locked
        lastActivityRef.current = Date.now();
      }
      tabHiddenAtRef.current = null;
    };

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isUnlocked, lock]);

  // Track auth state and prompt reauth when vault is locked
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setVaultKey(null);
        userIdRef.current = null;
        setShowReauth(false);
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
        // If user is logged in but vault is locked, prompt for password
        if (!vaultKey) {
          userIdRef.current = session.user.id;
          setShowReauth(true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [vaultKey]);

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdRef.current || !reauthPassword) return;
    setReauthLoading(true);
    setReauthError('');

    const success = await unlock(reauthPassword, userIdRef.current);
    if (!success) {
      setReauthError('Incorrect password. Please try again.');
    }
    setReauthLoading(false);
  };

  return (
    <EncryptionContext.Provider value={{ vaultKey, isUnlocked, unlock, lock, setupNewUser, rewrapVaultKey }}>
      {children}

      {/* Re-authentication modal (shown when auto-locked) */}
      <Dialog open={showReauth} onOpenChange={() => {}}>
        <DialogContent className="bg-card border-border max-w-sm [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Lock className="w-5 h-5 text-primary" />
              Vault Locked
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Your vault has been locked due to inactivity. Enter your password to unlock.
          </p>

          <form onSubmit={handleReauth} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="reauth-password">Password</Label>
              <Input
                id="reauth-password"
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                required
              />
            </div>
            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}
            <Button type="submit" className="w-full" disabled={reauthLoading}>
              {reauthLoading ? 'Unlocking…' : 'Unlock Vault'}
            </Button>
          </form>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Your encryption keys are cleared from memory when locked.</span>
          </div>
        </DialogContent>
      </Dialog>
    </EncryptionContext.Provider>
  );
};
