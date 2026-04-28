import { useEffect } from "react";
import { configureApiClient } from "../lib/apiClient";

function getStoredWorkspaceId() {
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
    console.error("Unable to read workspace ID from storage", error);
    return null;
  }
}

function clearStoredWorkspaceId() {
  try {
    localStorage.removeItem("activeWorkspaceId");
    localStorage.removeItem("workspaceId");
    sessionStorage.removeItem("activeWorkspaceId");
    sessionStorage.removeItem("workspaceId");
  } catch (error) {
    console.error("Unable to clear workspace ID from storage", error);
  }
}

export default function ApiClientBootstrap({
  getToken,
  getWorkspaceId,
  onUnauthorized,
  onForbidden,
  children,
}) {
  useEffect(() => {
    configureApiClient({
      getToken: async () => {
        if (typeof getToken === "function") {
          try {
            const token = await getToken();
            return token || null;
          } catch (error) {
            console.error("Failed to get auth token", error);
            return null;
          }
        }
        return null;
      },

      getWorkspaceId: async () => {
        if (typeof getWorkspaceId === "function") {
          try {
            const workspaceId = await getWorkspaceId();
            if (workspaceId) {
              return workspaceId;
            }
          } catch (error) {
            console.error("Failed to get workspace ID from provider", error);
          }
        }

        return getStoredWorkspaceId();
      },

      onUnauthorized: (error) => {
        clearStoredWorkspaceId();

        if (typeof onUnauthorized === "function") {
          onUnauthorized(error);
          return;
        }

        const currentPath = window.location.pathname;
        const isAlreadyOnAuthPage =
          currentPath.startsWith("/sign-in") || currentPath.startsWith("/sign-up");

        if (!isAlreadyOnAuthPage) {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          const encoded = encodeURIComponent(returnTo);
          window.location.assign(`/sign-in?redirect_url=${encoded}`);
        }
      },

      onForbidden: (error) => {
        if (typeof onForbidden === "function") {
          onForbidden(error);
          return;
        }

        console.error("Forbidden API request", error);
      },
    });
  }, [getToken, getWorkspaceId, onUnauthorized, onForbidden]);

  return children || null;
}
