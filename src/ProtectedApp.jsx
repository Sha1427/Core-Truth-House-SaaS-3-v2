import React, { Suspense, useCallback } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  ClerkProvider as ClerkProviderActual,
  useAuth as useAuthActual,
} from "@clerk/react";

import { ThemeProvider } from "./context/ThemeContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { PlanProvider } from "./context/PlanContext";

import ApiClientBootstrap from "./components/ApiClientBootstrap";
import { AppVersionBanner } from "./components/shared/useAppVersion";
import { Toaster } from "./components/ui/toaster";
import { SignInPage, SignUpPage } from "./components/Auth";

const AppRouter = React.lazy(() => import("./navigation/AppRouter"));
const LockScreen = React.lazy(() => import("./pages/LockScreen"));

const CLERK_KEY_RAW = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const HAS_CLERK = Boolean(CLERK_KEY_RAW && CLERK_KEY_RAW.startsWith("pk_"));

let ClerkProvider = null;
let clerkUseAuth = null;

if (HAS_CLERK) {
  ClerkProvider = ClerkProviderActual;
  clerkUseAuth = useAuthActual;
}

function useOptionalClerkAuth() {
  if (!clerkUseAuth) {
    return {
      getToken: async () => null,
      signOut: async () => {},
      isSignedIn: false,
      isLoaded: true,
      userId: null,
    };
  }

  return clerkUseAuth();
}

function AdminLoginRedirect() {
  return <Navigate to="/sign-in?redirect_url=%2Fadmin" replace />;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--cth-admin-bg,#efe7e3)] px-6 py-12 text-[var(--cth-admin-ink,#2b1040)]">
      Loading Core Truth House...
    </div>
  );
}

function ProtectedRoutes() {
  return (
    <>
      <AppVersionBanner />

      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/admin-login" element={<AdminLoginRedirect />} />
        <Route path="/lock-screen" element={<LockScreen />} />
        <Route
          path="/*"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AppRouter />
            </Suspense>
          }
        />
      </Routes>

      <Toaster />
    </>
  );
}

function ProtectedShell() {
  const auth = useOptionalClerkAuth();

  const getToken = useCallback(async () => {
    if (!auth || typeof auth.getToken !== "function") {
      return null;
    }

    try {
      return (await auth.getToken()) || null;
    } catch (error) {
      console.error("Failed to retrieve auth token", error);
      return null;
    }
  }, [auth]);

  const getWorkspaceId = useCallback(async () => {
    try {
      const directId =
        localStorage.getItem("activeWorkspaceId") ||
        localStorage.getItem("workspaceId") ||
        sessionStorage.getItem("activeWorkspaceId") ||
        sessionStorage.getItem("workspaceId");

      if (directId) return directId;

      const rawWorkspace =
        localStorage.getItem("activeWorkspace") ||
        sessionStorage.getItem("activeWorkspace");

      if (rawWorkspace) {
        const parsed = JSON.parse(rawWorkspace);
        return parsed?.id || parsed?.workspace_id || null;
      }

      return null;
    } catch (error) {
      console.error("Failed to read workspace ID from storage", error);
      return null;
    }
  }, []);

  const handleUnauthorized = useCallback(async (error) => {
    console.warn("Unauthorized response suppressed during auth recovery", error);
  }, []);

  return (
    <ApiClientBootstrap
      getToken={getToken}
      getWorkspaceId={getWorkspaceId}
      onUnauthorized={handleUnauthorized}
      isAuthLoaded={Boolean(auth?.isLoaded)}
      isSignedIn={Boolean(auth?.isSignedIn)}
    >
      <ProtectedRoutes />
    </ApiClientBootstrap>
  );
}

function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <PlanProvider>{children}</PlanProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  );
}

export default function ProtectedApp() {
  const content = (
    <AppProviders>
      <ProtectedShell />
    </AppProviders>
  );

  if (HAS_CLERK && ClerkProvider) {
    return (
      <ClerkProvider
        publishableKey={CLERK_KEY_RAW}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/command-center"
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
