import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { canAccess, getRequiredPlan, PLAN_INFO, normalizePlan } from '../config/planAccess';
import { useUser } from '../hooks/useAuth';

const API = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '';

const PlanContext = createContext({
  plan: 'foundation',
  isSuperAdmin: false,
  userRole: 'MEMBER',
  loading: true,
  canAccess: () => true,
  getRequiredPlanForRoute: () => 'foundation',
  getUpgradeInfo: () => null,
});

export function PlanProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [plan, setPlan] = useState('foundation');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);

  const userId = user?.id || 'default';

  useEffect(() => {
  console.log("[PlanContext] effect:start", {
    isLoaded,
    userId,
    hasUser: !!user,
    api: API,
  });

  if (!isLoaded || userId === 'default') {
    console.log("[PlanContext] skipping fetchPlan", {
      reason: !isLoaded ? "auth-not-loaded" : "default-user-id",
    });
    setLoading(false);
    return;
  }

  const fetchPlan = async () => {
    try {
      console.log("[PlanContext] fetchPlan:request", {
        url: `${API}/api/user/plan?user_id=${userId}`,
      });

      const res = await axios.get(`${API}/api/user/plan?user_id=${userId}`);

      console.log("[PlanContext] fetchPlan:response", res.data);

      setPlan(normalizePlan(res.data.plan || 'FOUNDATION'));
      const superAdmin = res.data.is_super_admin || false;
      setIsSuperAdmin(superAdmin);
      if (superAdmin) {
        setUserRole('SUPER_ADMIN');
      } else {
        setUserRole(res.data.role || 'MEMBER');
      }
    } catch (error) {
      console.error("[PlanContext] fetchPlan:error", error);
      setPlan('foundation');
      setIsSuperAdmin(false);
      setUserRole('MEMBER');
    } finally {
      setLoading(false);
    }
  };

  fetchPlan();
}, [userId, isLoaded, user]);

  const checkAccess = (route) => canAccess(plan, route, isSuperAdmin);

  const getRequiredPlanForRoute = (route) => getRequiredPlan(route);

  const getUpgradeInfo = (route) => {
    const required = getRequiredPlan(route);
    const info = PLAN_INFO[required];
    if (!info) return null;
    return { plan: required, ...info };
  };

  return (
    <PlanContext.Provider value={{
      plan,
      isSuperAdmin,
      userRole,
      loading,
      canAccess: checkAccess,
      getRequiredPlanForRoute,
      getUpgradeInfo,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}



