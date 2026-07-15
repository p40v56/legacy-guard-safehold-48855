import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type PlanTier = 'free' | 'essential' | 'family';

export interface PlanLimits {
  maxContacts: number;
  maxDocuments: number;
  maxStorageMb: number;
  maxFinancialAssets: number;
  maxAccounts: number;
  portalAccess: boolean;
  customCheckInFrequency: boolean;
  securityQuestions: boolean;
  customEmail: boolean;
  activationRules: boolean;
  fileUploads: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxContacts: 1,
    maxDocuments: 1,
    maxStorageMb: 0,
    maxFinancialAssets: 2,
    maxAccounts: 0,
    portalAccess: true,
    customCheckInFrequency: false,
    securityQuestions: false,
    customEmail: false,
    activationRules: false,
    fileUploads: false,
  },
  essential: {
    maxContacts: 5,
    maxDocuments: 20,
    maxStorageMb: 500,
    maxFinancialAssets: 10,
    maxAccounts: 10,
    portalAccess: true,
    customCheckInFrequency: true,
    securityQuestions: true,
    customEmail: true,
    activationRules: true,
    fileUploads: true,
  },
  family: {
    maxContacts: Infinity,
    maxDocuments: Infinity,
    maxStorageMb: 5120,
    maxFinancialAssets: Infinity,
    maxAccounts: Infinity,
    portalAccess: true,
    customCheckInFrequency: true,
    securityQuestions: true,
    customEmail: true,
    activationRules: true,
    fileUploads: true,
  },
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  essential: 'Essential',
  family: 'Family',
};

export const PLAN_PRICES: Record<PlanTier, string> = {
  free: 'Free',
  essential: '£49/year',
  family: '£99/year',
};

const rawToTier = (raw: string): PlanTier => {
  if (raw === 'family') return 'family';
  if (raw === 'essential' || raw === 'paid') return 'essential';
  return 'free';
};

interface PlanInfo {
  plan: PlanTier;
  limits: PlanLimits;
  rawPlan: string;
  planExpiresAt: string | null;
  isExpired: boolean;
  isAdmin: boolean;
  isPaid: boolean;
  isFree: boolean;
  loading: boolean;
}

export const usePlan = (): PlanInfo => {
  const { user } = useAuth();
  const [rawPlan, setRawPlan] = useState<string>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlanAndRole = async () => {
      try {
        const [profileResult, roleResult] = await Promise.all([
          supabase.from('profiles').select('plan, plan_expires_at').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', user.id),
        ]);

        if (profileResult.data) {
          setRawPlan(profileResult.data.plan || 'free');
          setPlanExpiresAt(profileResult.data.plan_expires_at || null);
        }

        if (roleResult.data) {
          setIsAdmin(roleResult.data.some((r) => r.role === 'admin'));
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndRole();
  }, [user]);

  const tier = rawToTier(rawPlan);
  const isExpired = tier !== 'free' && !!planExpiresAt && new Date(planExpiresAt) <= new Date();
  const effectiveTier: PlanTier = isExpired ? 'free' : tier;

  return {
    plan: effectiveTier,
    limits: PLAN_LIMITS[effectiveTier],
    rawPlan,
    planExpiresAt,
    isExpired,
    isAdmin,
    isPaid: effectiveTier !== 'free',
    isFree: effectiveTier === 'free',
    loading,
  };
};
