import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";

const WALL_WHITELIST = new Set(["/billing", "/lock-screen"]);

function isWhitelisted(pathname) {
  if (!pathname) return false;
  if (WALL_WHITELIST.has(pathname)) return true;
  return Array.from(WALL_WHITELIST).some((allowed) =>
    pathname === allowed || pathname.startsWith(`${allowed}/`)
  );
}

function WallLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cth-admin-bg, #efe7e3)",
        color: "var(--cth-admin-ink, #2b1040)",
        padding: "48px 24px",
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      Loading Core Truth House...
    </div>
  );
}

export default function BillingWall({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const { loading, hasActivePlan, planResolved } = usePlan();
  const location = useLocation();

  if (!isLoaded) {
    return <WallLoading />;
  }

  if (!isSignedIn) {
    return children;
  }

  if (loading || !planResolved) {
    return <WallLoading />;
  }

  if (hasActivePlan) {
    return children;
  }

  if (isWhitelisted(location.pathname)) {
    return children;
  }

  return <Navigate to="/billing" replace />;
}
