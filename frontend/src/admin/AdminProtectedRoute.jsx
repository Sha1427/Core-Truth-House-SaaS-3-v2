import React, { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "OPS_ADMIN",
  "BILLING_ADMIN",
  "CONTENT_ADMIN",
  "SUPPORT_ADMIN",
  "ADMIN",
];

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function getUserMetadataAdminState(user) {
  const publicMetadata = user?.publicMetadata || {};
  const unsafeMetadata = user?.unsafeMetadata || {};
  const privateMetadata = user?.privateMetadata || {};

  const globalRole = normalizeRole(
    publicMetadata.global_role ||
      unsafeMetadata.global_role ||
      privateMetadata.global_role ||
      user?.global_role
  );

  const workspaceRole = normalizeRole(
    publicMetadata.workspace_role ||
      unsafeMetadata.workspace_role ||
      privateMetadata.workspace_role ||
      user?.workspace_role
  );

  const isSuperAdminFlag =
    publicMetadata.is_super_admin ??
    unsafeMetadata.is_super_admin ??
    privateMetadata.is_super_admin ??
    user?.is_super_admin;

  const isAdminFlag =
    publicMetadata.is_admin ??
    unsafeMetadata.is_admin ??
    privateMetadata.is_admin ??
    user?.is_admin;

  const metadataIsSuperAdmin =
    Boolean(isSuperAdminFlag) || globalRole === "SUPER_ADMIN";

  const metadataIsAdmin =
    metadataIsSuperAdmin ||
    Boolean(isAdminFlag) ||
    ADMIN_ROLES.includes(globalRole) ||
    ADMIN_ROLES.includes(workspaceRole);

  return {
    metadataIsSuperAdmin,
    metadataIsAdmin,
    globalRole,
    workspaceRole,
  };
}

export default function AdminProtectedRoute() {
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const { userRole, isSuperAdmin, isAdmin, loading } = usePlan();

  const [workspaceFallbackLoading, setWorkspaceFallbackLoading] = useState(true);
  const [workspaceFallbackAllowed, setWorkspaceFallbackAllowed] = useState(false);
  const [workspaceFallbackDebug, setWorkspaceFallbackDebug] = useState({
    matchedWorkspace: null,
    updatedByRole: null,
    ownerId: null,
  });

  const {
    metadataIsSuperAdmin,
    metadataIsAdmin,
    globalRole,
    workspaceRole,
  } = getUserMetadataAdminState(user);

  useEffect(() => {
    let cancelled = false;

    async function checkWorkspaceFallback() {
      if (!isLoaded || !user?.id) {
        setWorkspaceFallbackLoading(false);
        setWorkspaceFallbackAllowed(false);
        return;
      }

      try {
        const res = await apiClient.get("/api/workspaces/mine");
        const workspaces = Array.isArray(res?.workspaces) ? res.workspaces : [];

        const matched = workspaces.find((w) => {
          const ownerId = String(w.owner_id || w.owner_user_id || w.user_id || "").trim();
          const clerkUserId = String(w.clerk_user_id || "").trim();
          const updatedByRole = normalizeRole(w.updated_by_role);
          const adminNotes = String(w.admin_notes || "").toLowerCase();

          return (
            ownerId === user.id ||
            clerkUserId === user.id ||
            updatedByRole === "SUPER_ADMIN" ||
            adminNotes.includes("super administrator")
          );
        });

        if (!cancelled) {
          setWorkspaceFallbackAllowed(Boolean(matched));
          setWorkspaceFallbackDebug({
            matchedWorkspace: matched?.name || null,
            updatedByRole: matched?.updated_by_role || null,
            ownerId: matched?.owner_id || matched?.owner_user_id || matched?.user_id || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Admin workspace fallback check failed:", error);
          setWorkspaceFallbackAllowed(false);
        }
      } finally {
        if (!cancelled) {
          setWorkspaceFallbackLoading(false);
        }
      }
    }

    checkWorkspaceFallback();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  if (!isLoaded || loading || workspaceFallbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cth-surface-midnight)] text-white">
        Loading admin access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/sign-in" replace state={{ from: location }} />;
  }

  const normalizedPlanRole = normalizeRole(userRole);

  const isAllowed =
    Boolean(isSuperAdmin) ||
    Boolean(isAdmin) ||
    ADMIN_ROLES.includes(normalizedPlanRole) ||
    metadataIsSuperAdmin ||
    metadataIsAdmin ||
    workspaceFallbackAllowed;

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cth-surface-midnight)] p-6">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--cth-surface-sidebar-border)] bg-[linear-gradient(180deg,var(--cth-admin-ink),var(--cth-surface-midnight))] p-8 text-[var(--cth-on-dark)] shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--cth-admin-muted)]">Core Truth House</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-sm text-[var(--cth-admin-border)]">
            Your session is signed in, but it does not currently resolve to an admin-authorized role.
          </p>

          <div className="mt-5 rounded-xl border border-[var(--cth-sidebar-panel-border)] bg-[var(--cth-surface-deep)] p-4 text-sm">
            <div><strong>Plan role:</strong> {normalizedPlanRole || "UNKNOWN"}</div>
            <div><strong>Global role:</strong> {globalRole || "UNKNOWN"}</div>
            <div><strong>Workspace role:</strong> {workspaceRole || "UNKNOWN"}</div>
            <div><strong>Plan says super admin:</strong> {String(Boolean(isSuperAdmin))}</div>
            <div><strong>Plan says admin:</strong> {String(Boolean(isAdmin))}</div>
            <div><strong>Metadata says super admin:</strong> {String(Boolean(metadataIsSuperAdmin))}</div>
            <div><strong>Metadata says admin:</strong> {String(Boolean(metadataIsAdmin))}</div>
            <div><strong>Workspace fallback allowed:</strong> {String(Boolean(workspaceFallbackAllowed))}</div>
            <div><strong>Matched workspace:</strong> {workspaceFallbackDebug.matchedWorkspace || "NONE"}</div>
            <div><strong>Workspace updated_by_role:</strong> {workspaceFallbackDebug.updatedByRole || "UNKNOWN"}</div>
            <div><strong>Workspace owner:</strong> {workspaceFallbackDebug.ownerId || "UNKNOWN"}</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/sign-in"
              className="inline-flex items-center rounded-lg bg-[var(--cth-admin-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Return to admin sign-in
            </Link>
            <Link
              to="/command-center"
              className="inline-flex items-center rounded-lg border border-[var(--cth-admin-muted)] px-4 py-2 text-sm font-medium text-[var(--cth-on-dark)]"
            >
              Go to command center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
