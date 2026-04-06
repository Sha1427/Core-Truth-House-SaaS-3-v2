import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { canAccess, getRequiredPlan, PLAN_INFO, normalizePlan } from "../config/planAccess";
import { useUser } from "../hooks/useAuth";

const API = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "";

const PlanContext = createContext({
  plan: "foundation",
  isSuperAdmin: false,
  userRole: "MEMBER",
  loading: true,
  canAccess: () => true,
  getRequiredPlanForRoute: () => "foundation",
  getUpgradeInfo: () => null,
});

export function PlanProvider({ children }) {
  const { user, isLoaded } = useUser();

  const [plan, setPlan] = useState("foundation");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState("MEMBER");
  const [loading, setLoading] = useState(true);

  const inFlightRef = useRef(false);
  const lastResolvedUserIdRef = useRef(null);

  const userId = user?.id || null;

  useEffect(() => {
    console.log("[PlanContext] effect:start", {
      isLoaded,
      userId,
      hasUser: !!user,
      api: API,
    });

    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (!userId) {
      console.log("[PlanContext] skipping fetchPlan", {
        reason: "no-user-id",
      });

      inFlightRef.current = false;
      lastResolvedUserIdRef.current = null;
      setPlan("foundation");
      setIsSuperAdmin(false);
      setUserRole("MEMBER");
      setLoading(false);
      return;
    }

    if (inFlightRef.current) {
      console.log("[PlanContext] skipping fetchPlan", {
        reason: "request-in-flight",
        userId,
      });
      return;
    }

    if (lastResolvedUserIdRef.current === userId) {
      console.log("[PlanContext] skipping fetchPlan", {
        reason: "already-resolved-for-user",
        userId,
      });
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchPlan = async () => {
      inFlightRef.current = true;
      setLoading(true);

      try {
        const url = `${API}/api/user/plan?user_id=${userId}`;

        console.log("[PlanContext] fetchPlan:request", { url });

        const res = await axios.get(url, {
          withCredentials: true,
        });

        if (isCancelled) return;

        console.log("[PlanContext] fetchPlan:response", res.data);

        setPlan(normalizePlan(res.data?.plan || "FOUNDATION"));

        const superAdmin = Boolean(res.data?.is_super_admin);
        setIsSuperAdmin(superAdmin);
        setUserRole(superAdmin ? "SUPER_ADMIN" : res.data?.role || "MEMBER");

        lastResolvedUserIdRef.current = userId;
      } catch (error) {
        if (isCancelled) return;

        console.error("[PlanContext] fetchPlan:error", error);

        setPlan("foundation");
        setIsSuperAdmin(false);
        setUserRole("MEMBER");
        lastResolvedUserIdRef.current = null;
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
        inFlightRef.current = false;
      }
    };

    fetchPlan();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, userId]);

  const value = useMemo(() => {
    const checkAccess = (route) => canAccess(plan, route, isSuperAdmin);

    const getRequiredPlanForRoute = (route) => getRequiredPlan(route);

    const getUpgradeInfo = (route) => {
      const required = getRequiredPlan(route);
      const info = PLAN_INFO[required];
      if (!info) return null;
      return { plan: required, ...info };
    };

    return {
      plan,
      isSuperAdmin,
      userRole,
      loading,
      canAccess: checkAccess,
      getRequiredPlanForRoute,
      getUpgradeInfo,
    };
  }, [plan, isSuperAdmin, userRole, loading]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
