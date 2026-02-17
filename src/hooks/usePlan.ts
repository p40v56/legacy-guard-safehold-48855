import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'paid';

interface PlanInfo {
  plan: PlanType;
  rawPlan: PlanType;
  planExpiresAt: string | null;
  isExpired: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export const usePlan = (): PlanInfo => {
  const { user } = useAuth();
  const [rawPlan, setRawPlan] = useState<PlanType>('free');
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
          supabase.from('profiles').select('plan, plan_expires_at').eq('user_id', user.id).single(),
          supabase.from('user_roles').select('role').eq('user_id', user.id),
        ]);

        if (profileResult.data) {
          setRawPlan((profileResult.data as any).plan || 'free');
          setPlanExpiresAt((profileResult.data as any).plan_expires_at || null);
        }

        if (roleResult.data) {
          setIsAdmin(roleResult.data.some((r: any) => r.role === 'admin'));
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndRole();
  }, [user]);

  const isExpired = rawPlan === 'paid' && !!planExpiresAt && new Date(planExpiresAt) <= new Date();
  const isPaid = rawPlan === 'paid' && (!planExpiresAt || new Date(planExpiresAt) > new Date());

  return {
    plan: isPaid ? 'paid' : 'free',
    rawPlan,
    planExpiresAt,
    isExpired,
    isAdmin,
    loading,
  };
};

// Feature limit helpers
export const FREE_PLAN_LIMITS = {
  maxContacts: 1,
  maxDocuments: 0,
  maxAccounts: 0,
  maxFinancialAssets: 2,
  maxRules: 1,
  hasPortalAccess: false,
  hasMultiChannelCheckin: false,
  hasFullEmailCustomization: false,
};
