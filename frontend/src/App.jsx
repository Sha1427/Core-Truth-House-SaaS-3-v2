// frontend/src/App.jsx

import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ClerkProvider as ClerkProviderActual, useAuth as useAuthActual } from "@clerk/clerk-react";

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
import { ProtectedRoute, SignInPage, SignUpPage } from "./components/Auth";

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

function BaseRoutes() {
  return (
    <>
      <AppVersionBanner />
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/" element={<Navigate to="/command-center" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <WorkspaceProvider>
                <AppRouter />
              </WorkspaceProvider>
            </ProtectedRoute>
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

  const getToken = async () => {
    if (!auth || typeof auth.getToken !== "function") {
      return null;
    }
    try {
      return (await auth.getToken()) || null;
    } catch (error) {
      console.error("Failed to retrieve auth token", error);
      return null;
    }
  };

  const getWorkspaceId = async () => {
    try {
      return (
        localStorage.getItem("activeWorkspaceId") ||
        localStorage.getItem("workspaceId") ||
        sessionStorage.getItem("activeWorkspaceId") ||
        sessionStorage.getItem("workspaceId") ||
        null
      );
    } catch (error) {
      console.error("Failed to read workspace ID from storage", error);
      return null;
    }
  };

  const handleUnauthorized = async () => {
    if (auth && typeof auth.signOut === "function" && HAS_CLERK) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Failed to sign out after unauthorized response", error);
      }
    }
  };

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
        clerkJSVersion="5.61.3"
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
