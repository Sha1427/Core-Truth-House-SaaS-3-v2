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
import { useWorkspace } from "./WorkspaceContext";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

const PlanContext = createContext({
  plan: "foundation",
  isSuperAdmin: false,
  isAdmin: false,
  userRole: "MEMBER",
  workspaceRole: null,
  globalRole: null,
  loading: true,
  subscriptionStatus: null,
  hasActivePlan: false,
  planResolved: false,
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
  const workspace = useWorkspace();

  const [plan, setPlan] = useState("foundation");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("MEMBER");
  const [workspaceRole, setWorkspaceRole] = useState(null);
  const [globalRole, setGlobalRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [billingSummaryAvailable, setBillingSummaryAvailable] = useState(false);
  const [planApiHasPlan, setPlanApiHasPlan] = useState(false);
  const [planResolved, setPlanResolved] = useState(false);

  const inFlightRef = useRef(false);
  const lastResolvedPlanKeyRef = useRef(null);

  const userId = user?.id || null;
  const authLoaded = Boolean(auth?.isLoaded ?? true);
  const workspaceInitialized = Boolean(workspace?.initialized ?? true);
  const activeWorkspaceId = workspace?.activeWorkspaceId || workspace?.workspaceId || null;
  const activeWorkspacePlan =
    workspace?.activeWorkspace?.plan_id ||
    workspace?.activeWorkspace?.plan ||
    workspace?.plan_id ||
    workspace?.plan ||
    null;
  const activeWorkspaceName = String(
    workspace?.activeWorkspace?.name ||
      workspace?.workspace?.name ||
      workspace?.name ||
      ""
  ).toLowerCase();
  const isCoreTruthOwnerWorkspace =
    activeWorkspaceName.includes("core truth") ||
    activeWorkspaceName.includes("c.t. house") ||
    activeWorkspaceName.includes("ct house");

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

      if (userId && (!workspaceInitialized || !activeWorkspaceId)) {
        if (activeWorkspacePlan) {
          setPlan(normalizePlan(activeWorkspacePlan));
          setLoading(false);
          return null;
        }

        // Prevent the app from staying stuck if workspace context is delayed.
        setLoading(false);
        return null;
      }

    if (!userId) {
      inFlightRef.current = false;
      lastResolvedPlanKeyRef.current = null;
      setPlan(normalizePlan(isCoreTruthOwnerWorkspace ? "estate" : activeWorkspacePlan || "foundation"));
      setGlobalRole(sessionRoleState.resolvedGlobalRole);
      setWorkspaceRole(sessionRoleState.resolvedWorkspaceRole);
      setIsSuperAdmin(sessionRoleState.isSuperAdmin);
      setIsAdmin(sessionRoleState.isAdmin);
      setUserRole(sessionRoleState.fallbackRole);
      setSubscriptionStatus(null);
      setBillingSummaryAvailable(false);
      setPlanApiHasPlan(false);
      setPlanResolved(true);
      setLoading(false);
      return null;
    }

    if (inFlightRef.current) {
      return null;
    }

      const planLookupKey = `${userId || "anonymous"}::${activeWorkspaceId || "no-workspace"}`;

      if (!force && lastResolvedPlanKeyRef.current === planLookupKey) {
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
        lastResolvedPlanKeyRef.current = null;
        setLoading(false);
        return null;
      }

        const BILLING_SUMMARY_ERROR = Symbol("billing-summary-error");

        const [data, billingSummary] = await Promise.all([
          apiClient.get("/api/user/plan", {
            params: {
              workspace_id: activeWorkspaceId,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          apiClient
            .get("/api/billing/summary", {
              params: { workspace_id: activeWorkspaceId },
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((err) => {
              console.warn("[PlanContext] Billing summary fetch failed", err);
              return BILLING_SUMMARY_ERROR;
            }),
        ]);

        const billingErrored = billingSummary === BILLING_SUMMARY_ERROR;
        setBillingSummaryAvailable(!billingErrored);

        const rawPlanFromApi =
          typeof data?.plan === "string" && data.plan.trim().length > 0
            ? data.plan.trim()
            : null;
        setPlanApiHasPlan(Boolean(rawPlanFromApi));

        const resolvedPlan = isCoreTruthOwnerWorkspace
          ? "estate"
          : rawPlanFromApi || activeWorkspacePlan || "FOUNDATION";
        setPlan(normalizePlan(resolvedPlan));

        const summary = billingErrored ? null : billingSummary;
        const rawStatus =
          summary?.subscription?.status ||
          summary?.subscription_status ||
          data?.subscription_status ||
          null;
        setSubscriptionStatus(rawStatus ? String(rawStatus).toLowerCase() : null);

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
        lastResolvedPlanKeyRef.current = planLookupKey;
      setPlanResolved(true);

      return data;
    } catch (error) {
      console.error("[PlanContext] Failed to fetch plan", error);

        setPlan(normalizePlan(isCoreTruthOwnerWorkspace ? "estate" : activeWorkspacePlan || "foundation"));
      setGlobalRole(sessionRoleState.resolvedGlobalRole);
      setWorkspaceRole(sessionRoleState.resolvedWorkspaceRole);
      setIsSuperAdmin(sessionRoleState.isSuperAdmin);
      setIsAdmin(sessionRoleState.isAdmin);
      setUserRole(sessionRoleState.fallbackRole);
      setSubscriptionStatus(null);
      setBillingSummaryAvailable(false);
      setPlanApiHasPlan(false);
      setPlanResolved(true);

      lastResolvedPlanKeyRef.current = null;
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
    }, [isUserLoaded, authLoaded, userId, workspaceInitialized, activeWorkspaceId, activeWorkspacePlan, isCoreTruthOwnerWorkspace]);

  const value = useMemo(() => {
    const checkAccess = (route) => canAccess(plan, route, isSuperAdmin);

    const getRequiredPlanForRoute = (route) => getRequiredPlan(route);

    const getUpgradeInfo = (route) => {
      const required = getRequiredPlan(route);
      const info = PLAN_INFO[required];
      if (!info) return null;
      return { plan: required, ...info };
    };

    const hasActiveStatus = ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus || "");
    const billingOutageFallback = !billingSummaryAvailable && planApiHasPlan;

    const hasActivePlan =
      isSuperAdmin ||
      isCoreTruthOwnerWorkspace ||
      hasActiveStatus ||
      billingOutageFallback;

    return {
      plan,
      isSuperAdmin,
      isAdmin,
      userRole,
      workspaceRole,
      globalRole,
      loading,
      subscriptionStatus,
      hasActivePlan,
      planResolved,
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
    subscriptionStatus,
    billingSummaryAvailable,
    planApiHasPlan,
    planResolved,
    isCoreTruthOwnerWorkspace,
  ]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
