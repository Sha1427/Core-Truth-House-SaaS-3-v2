import { useMemo } from "react";
import {
  useUser as clerkUseUserFn,
  useClerk as clerkUseClerkFn,
  useAuth as clerkUseAuthFn,
} from "@clerk/react";

const CLERK_KEY_RAW = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
export const HAS_CLERK = Boolean(CLERK_KEY_RAW && CLERK_KEY_RAW.startsWith("pk_"));

const clerkUseUser = clerkUseUserFn;
const clerkUseClerk = clerkUseClerkFn;
const clerkUseAuth = clerkUseAuthFn;

function fallbackUserState() {
  return { isLoaded: true, isSignedIn: false, user: null };
}
function fallbackClerkState() {
  return {
    signOut: async () => {
      try {
        localStorage.removeItem("activeWorkspaceId");
        localStorage.removeItem("workspaceId");
        sessionStorage.removeItem("activeWorkspaceId");
        sessionStorage.removeItem("workspaceId");
      } catch (error) {
        console.error("Failed to clear local session state on sign out", error);
      }
    },
  };
}
function fallbackAuthState() {
  return { isLoaded: true, isSignedIn: false, userId: null, sessionId: null, getToken: async () => null };
}

export function useUser() {
  if (!HAS_CLERK || !clerkUseUser) return fallbackUserState();
  return clerkUseUser();
}
export function useClerk() {
  if (!HAS_CLERK || !clerkUseClerk) return fallbackClerkState();
  return clerkUseClerk();
}
export function useAuth() {
  if (!HAS_CLERK || !clerkUseAuth) return fallbackAuthState();
  return clerkUseAuth();
}
export function useSessionToken() {
  const auth = useAuth();
  return useMemo(() => {
    return async () => {
      if (!auth || typeof auth.getToken !== "function") return null;
      try {
        const token = await auth.getToken();
        return token || null;
      } catch (error) {
        console.error("Failed to fetch session token", error);
        return null;
      }
    };
  }, [auth]);
}
export default { HAS_CLERK, useUser, useClerk, useAuth, useSessionToken };
