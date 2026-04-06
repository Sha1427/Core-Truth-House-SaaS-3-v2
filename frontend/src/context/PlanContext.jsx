import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  canAccess,
  getRequiredPlan,
  PLAN_INFO,
  normalizePlan,
} from "../config/planAccess";
import { useUser, useAuth } from "../hooks/useAuth";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

const PlanContext = createContext({
  plan: "foundation",
  isSuperAdmin: false,
  isAdmin: false,
  userRole: "MEMBER",
  workspaceRole: null,
  globalRole: null,
  loading: true,
  canAccess: () => true,
  getRequiredPlanForRoute: () => "foundation",
  getUpgradeInfo: () => null,
  refreshPlan: async () => {},
});

function stringValue(value) {
  return String(value || "").trim();
}

function normalizeRole(value, fallback = null) {
  const normalized = stringValue(value).toUpperCase();
  return normalized || fallback;
}

function inferAdminFlags({ globalRole, isSuperAdminFlag, isAdminFlag }) {
  const superAdmin =
    Boolean(isSuperAdminFlag) || globalRole === "SUPER_ADMIN";

  const admin =
    superAdmin ||
    Boolean(isAdminFlag) ||
    ["OPS_ADMIN", "BILLING_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN", "ADMIN"].includes(globalRole);

  return {
    isSuperAdmin: superAdmin,
    isAdmin: admin,
  };
}

export function PlanProvider({ children }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const auth = useAuth();

  const [plan, setPlan] = useState("foundation");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("MEMBER");
  const [workspaceRole, setWorkspaceRole] = useState(null);
  const [globalRole, setGlobalRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const inFlightRef = useRef(false);
  const lastResolvedUserIdRef = useRef(null);

  const userId = user?.id || null;
  const authLoaded = Boolean(auth?.isLoaded ?? true);

  const syncRoleStateFromSession = useMemo(() => {
    const publicMetadata = user?.publicMetadata || {};
    const unsafeMetadata = user?.unsafeMetadata || {};
    const privateMetadata = user?.privateMetadata || {};

    const resolvedGlobalRole = normalizeRole(
      publicMetadata.global_role ||
        unsafeMetadata.global_role ||
        privateMetadata.global_role ||
        user?.global_role,
      null
    );

    const resolvedWorkspaceRole = normalizeRole(
      publicMetadata.workspace_role ||
        unsafeMetadata.workspace_role ||
        privateMetadata.workspace_role ||
        user?.workspace_role,
      null
    );

    const flags = inferAdminFlags({
      globalRole: resolvedGlobalRole,
      isSuperAdminFlag:
        publicMetadata.is_super_admin ??
        unsafeMetadata.is_super_admin ??
        privateMetadata.is_super_admin ??
        user?.is_super_admin,
      isAdminFlag:
        publicMetadata.is_admin ??
        unsafeMetadata.is_admin ??
        privateMetadata.is_admin ??
        user?.is_admin,
    });

    return {
      resolvedGlobalRole,
      resolvedWorkspaceRole,
      ...flags,
    };
  }, [user]);

  useEffect(() => {
    const fallbackRole = syncRoleStateFromSession.isSuperAdmin
      ? "SUPER_ADMIN"
      : syncRoleStateFromSession.resolvedGlobalRole ||
        syncRoleStateFromSession.resolvedWorkspaceRole ||
        "MEMBER";

    setGlobalRole(syncRoleStateFromSession.resolvedGlobalRole);
    setWorkspaceRole(syncRoleStateFromSession.resolvedWorkspaceRole);
    setIsSuperAdmin(syncRoleStateFromSession.isSuperAdmin);
    setIsAdmin(syncRoleStateFromSession.isAdmin);
    setUserRole(fallbackRole);
  }, [syncRoleStateFromSession]);

  const fetchPlan = async ({ force = false } = {}) => {
    console.log("[PlanContext] fetchPlan:request", {
      isUserLoaded,
      authLoaded,
      hasUser: Boolean(userId),
      force,
    });

    if (!isUserLoaded || !authLoaded) {
      setLoading(true);
      return null;
    }

    if (!userId) {
      inFlightRef.current = false;
      lastResolvedUserIdRef.current = null;
      setPlan("foundation");
      setLoading(false);
      return null;
    }

    if (inFlightRef.current) {
      return null;
    }

    if (!force && lastResolvedUserIdRef.current === userId) {
      setLoading(false);
      return null;
    }

    inFlightRef.current = true;
    setLoading(true);

    try {
      let token = null;

      if (auth && typeof auth.getToken === "function") {
        token = await auth.getToken();
      }

      if (!token) {
        console.warn("[PlanContext] No auth token available yet");
        lastResolvedUserIdRef.current = null;
        return null;
      }

      const res = await axios.get(`${API}/api/user/plan`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: false,
      });

      const data = res?.data || {};

      setPlan(normalizePlan(data.plan || "FOUNDATION"));

      const backendGlobalRole = normalizeRole(
        data.global_role,
        syncRoleStateFromSession.resolvedGlobalRole
      );
      const backendWorkspaceRole = normalizeRole(
        data.workspace_role,
        syncRoleStateFromSession.resolvedWorkspaceRole
      );

      const flags = inferAdminFlags({
        globalRole: backendGlobalRole,
        isSuperAdminFlag: data.is_super_admin,
        isAdminFlag: data.is_admin,
      });

      setGlobalRole(backendGlobalRole);
      setWorkspaceRole(backendWorkspaceRole);
      setIsSuperAdmin(flags.isSuperAdmin);
      setIsAdmin(flags.isAdmin);

      const resolvedUserRole = flags.isSuperAdmin
        ? "SUPER_ADMIN"
        : backendGlobalRole ||
          backendWorkspaceRole ||
          normalizeRole(data.role, "MEMBER") ||
          "MEMBER";

      setUserRole(resolvedUserRole);
      lastResolvedUserIdRef.current = userId;

      return data;
    } catch (error) {
      console.error("[PlanContext] fetchPlan:error", error);

      setPlan("foundation");

      const fallbackRole = syncRoleStateFromSession.isSuperAdmin
        ? "SUPER_ADMIN"
        : syncRoleStateFromSession.resolvedGlobalRole ||
          syncRoleStateFromSession.resolvedWorkspaceRole ||
          "MEMBER";

      setGlobalRole(syncRoleStateFromSession.resolvedGlobalRole);
      setWorkspaceRole(syncRoleStateFromSession.resolvedWorkspaceRole);
      setIsSuperAdmin(syncRoleStateFromSession.isSuperAdmin);
      setIsAdmin(syncRoleStateFromSession.isAdmin);
      setUserRole(fallbackRole);

      lastResolvedUserIdRef.current = null;
      return null;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[PlanContext] effect:start", {
      isUserLoaded,
      authLoaded,
      userId,
    });

    if (!isUserLoaded || !authLoaded) {
      console.log("[PlanContext] skipping fetchPlan", {
        reason: "auth_or_user_not_loaded",
      });
      return;
    }

    fetchPlan();
  }, [isUserLoaded, authLoaded, userId]);

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
      isAdmin,
      userRole,
      workspaceRole,
      globalRole,
      loading,
      canAccess: checkAccess,
      getRequiredPlanForRoute,
      getUpgradeInfo,
      refreshPlan: () => fetchPlan({ force: true }),
    };
  }, [
    plan,
    isSuperAdmin,
    isAdmin,
    userRole,
    workspaceRole,
    globalRole,
    loading,
  ]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
