import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  canAccess,
  getRequiredPlan,
  PLAN_INFO,
  normalizePlan,
} from "../config/planAccess";
import { useUser, useAuth } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";

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

function getSessionRoleState(user) {
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

  const fallbackRole = flags.isSuperAdmin
    ? "SUPER_ADMIN"
    : resolvedGlobalRole || resolvedWorkspaceRole || "MEMBER";

  return {
    resolvedGlobalRole,
    resolvedWorkspaceRole,
    fallbackRole,
    ...flags,
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

  const sessionRoleState = useMemo(() => getSessionRoleState(user), [user]);

  useEffect(() => {
    setGlobalRole(sessionRoleState.resolvedGlobalRole);
    setWorkspaceRole(sessionRoleState.resolvedWorkspaceRole);
    setIsSuperAdmin(sessionRoleState.isSuperAdmin);
    setIsAdmin(sessionRoleState.isAdmin);
    setUserRole(sessionRoleState.fallbackRole);
  }, [sessionRoleState]);

  const fetchPlan = async ({ force = false } = {}) => {
    if (!isUserLoaded || !authLoaded) {
      setLoading(true);
      return null;
    }

    if (!userId) {
      inFlightRef.current = false;
      lastResolvedUserIdRef.current = null;
      setPlan("foundation");
      setGlobalRole(sessionRoleState.resolvedGlobalRole);
      setWorkspaceRole(sessionRoleState.resolvedWorkspaceRole);
      setIsSuperAdmin(sessionRoleState.isSuperAdmin);
      setIsAdmin(sessionRoleState.isAdmin);
      setUserRole(sessionRoleState.fallbackRole);
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
      const token =
        auth && typeof auth.getToken === "function"
          ? await auth.getToken()
          : null;

      if (!token) {
        lastResolvedUserIdRef.current = null;
        setLoading(false);
        return null;
      }

      const data = await apiClient.get("/api/user/plan", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        workspace: false,
      });

      setPlan(normalizePlan(data?.plan || "FOUNDATION"));

      const backendGlobalRole = normalizeRole(
        data?.global_role,
        sessionRoleState.resolvedGlobalRole
      );

      const backendWorkspaceRole = normalizeRole(
        data?.workspace_role,
        sessionRoleState.resolvedWorkspaceRole
      );

      const flags = inferAdminFlags({
        globalRole: backendGlobalRole,
        isSuperAdminFlag: data?.is_super_admin,
        isAdminFlag: data?.is_admin,
      });

      setGlobalRole(backendGlobalRole);
      setWorkspaceRole(backendWorkspaceRole);
      setIsSuperAdmin(flags.isSuperAdmin);
      setIsAdmin(flags.isAdmin);

      const resolvedUserRole = flags.isSuperAdmin
        ? "SUPER_ADMIN"
        : backendGlobalRole ||
          backendWorkspaceRole ||
          normalizeRole(data?.role, "MEMBER") ||
          "MEMBER";

      setUserRole(resolvedUserRole);
      lastResolvedUserIdRef.current = userId;

      return data;
    } catch (error) {
      console.error("[PlanContext] Failed to fetch plan", error);

      setPlan("foundation");
      setGlobalRole(sessionRoleState.resolvedGlobalRole);
      setWorkspaceRole(sessionRoleState.resolvedWorkspaceRole);
      setIsSuperAdmin(sessionRoleState.isSuperAdmin);
      setIsAdmin(sessionRoleState.isAdmin);
      setUserRole(sessionRoleState.fallbackRole);

      lastResolvedUserIdRef.current = null;
      return null;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded || !authLoaded) {
      return;
    }

    void fetchPlan();
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
