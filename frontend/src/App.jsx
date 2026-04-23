// frontend/src/App.jsx

import React, { useCallback } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  ClerkProvider as ClerkProviderActual,
  useAuth as useAuthActual,
} from "@clerk/react";

import "./index.css";

import { ThemeProvider } from "./context/ThemeContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { PlanProvider } from "./context/PlanContext";
import { DemoModeProvider } from "./context/DemoModeContext";

import ApiClientBootstrap from "./components/ApiClientBootstrap";
import { AppVersionBanner } from "./components/shared/useAppVersion";
import { Toaster } from "./components/ui/toaster";
import Chatbot from "./components/Chatbot";

import AppRouter from "./navigation/AppRouter";
import { SignInPage, SignUpPage } from "./components/Auth";

import LandingPage from "./pages/LandingPage";

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

function BaseRoutes() {
  return (
    <>
      <AppVersionBanner />

      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/admin-login" element={<AdminLoginRedirect />} />
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/*"
          element={
            <WorkspaceProvider>
              <AppRouter />
            </WorkspaceProvider>
          }
        />
      </Routes>

      <Chatbot />
      <Toaster />
    </>
  );
}

function AppShell() {
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
    >
      <BaseRoutes />
    </ApiClientBootstrap>
  );
}

function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <PlanProvider>{children}</PlanProvider>
      </DemoModeProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  if (HAS_CLERK && ClerkProvider) {
    return (
      <ClerkProvider
        publishableKey={CLERK_KEY_RAW}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/command-center"
      >
        <AppProviders>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AppProviders>
      </ClerkProvider>
    );
  }

  return (
    <AppProviders>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProviders>
  );
}

export default function App() {
  return <AppContent />;
}
