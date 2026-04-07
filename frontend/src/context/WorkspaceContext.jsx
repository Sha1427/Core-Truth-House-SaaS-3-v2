import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import { useAuth, HAS_CLERK } from "../hooks/useAuth";

const WorkspaceContext = createContext(null);

const STORAGE_KEYS = {
  activeWorkspaceId: "activeWorkspaceId",
  workspaceId: "workspaceId",
};

function safeGetStorage(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch (error) {
    console.error(`Failed to read storage key: ${key}`, error);
    return null;
  }
}

function safeSetStorage(key, value) {
  try {
    if (value == null) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to write storage key: ${key}`, error);
  }
}

function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage key: ${key}`, error);
  }
}

function normalizeWorkspace(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id || raw.workspace_id || raw.workspaceId || null;
  if (!id) return null;

  const plan =
    raw.plan ||
    raw.plan_name ||
    raw.subscription_plan ||
    raw.tier ||
    raw.plan_id ||
    "free";

  return {
    id: String(id),
    workspace_id: String(id),
    name: raw.name || raw.workspace_name || "Workspace",
    status: raw.status || "active",
    role: raw.role || raw.workspace_role || null,
    owner_id: raw.owner_id || null,
    plan: String(plan).toLowerCase(),
    plan_id: raw.plan_id || raw.plan || null,
    raw,
  };
}

function getStoredWorkspaceId() {
  return (
    safeGetStorage(STORAGE_KEYS.activeWorkspaceId) ||
    safeGetStorage(STORAGE_KEYS.workspaceId) ||
    null
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function WorkspaceProvider({ children }) {
  const auth = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() =>
    getStoredWorkspaceId()
  );
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const fetchInFlightRef = useRef(false);
  const hasBootstrappedRef = useRef(false);
  const lastBootKeyRef = useRef(null);

  const clearWorkspaceState = useCallback(() => {
    safeRemoveStorage(STORAGE_KEYS.activeWorkspaceId);
    safeRemoveStorage(STORAGE_KEYS.workspaceId);

    setWorkspaces([]);
    setActiveWorkspaceIdState(null);
    setActiveWorkspace(null);
  }, []);

  const persistActiveWorkspaceId = useCallback((workspaceId) => {
    const normalizedId = workspaceId ? String(workspaceId) : null;

    safeSetStorage(STORAGE_KEYS.activeWorkspaceId, normalizedId);
    safeSetStorage(STORAGE_KEYS.workspaceId, normalizedId);
    setActiveWorkspaceIdState(normalizedId);
  }, []);

  const selectWorkspace = useCallback(
    (workspaceOrId) => {
      if (!workspaceOrId) {
        clearWorkspaceState();
        return;
      }

      const resolvedId =
        typeof workspaceOrId === "string"
          ? String(workspaceOrId)
          : String(
              workspaceOrId.id ||
                workspaceOrId.workspace_id ||
                workspaceOrId.workspaceId ||
                ""
            );

      if (!resolvedId) {
        clearWorkspaceState();
        return;
      }

      persistActiveWorkspaceId(resolvedId);

      const match = workspaces.find((item) => item.id === resolvedId) || null;
      setActiveWorkspace(match);
    },
    [clearWorkspaceState, persistActiveWorkspaceId, workspaces]
  );

  const fetchWorkspaces = useCallback(
    async ({ force = false } = {}) => {
      if (!HAS_CLERK) {
        setLoading(false);
        setInitialized(true);
        return [];
      }

      if (!auth?.isLoaded) {
        return [];
      }

      if (!auth?.isSignedIn) {
        hasBootstrappedRef.current = false;
        lastBootKeyRef.current = null;
        clearWorkspaceState();
        setError(null);
        setLoading(false);
        setInitialized(true);
        return [];
      }

      if (typeof auth?.getToken !== "function") {
        setLoading(false);
        setInitialized(true);
        return [];
      }

      if (fetchInFlightRef.current) {
        return workspaces;
      }

      const bootKey = `${auth?.userId || "unknown"}:${
        auth?.isSignedIn ? "signed-in" : "signed-out"
      }`;

      if (!force && hasBootstrappedRef.current && lastBootKeyRef.current === bootKey) {
        return workspaces;
      }

      fetchInFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        let token = await auth.getToken();

        if (!token) {
          await sleep(300);
          token = await auth.getToken();
        }

        if (!token) {
          return [];
        }

        const payload = await apiClient.get(
          API_PATHS.platform?.workspacesMine ||
            API_PATHS.workspacesMine ||
            "/api/workspaces/mine",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            workspace: false,
          }
        );

        const rawItems = payload?.workspaces || payload?.items || payload?.data || [];
        const normalized = Array.isArray(rawItems)
          ? rawItems.map(normalizeWorkspace).filter(Boolean)
          : [];

        setWorkspaces(normalized);

        const storedId = getStoredWorkspaceId();
        const resolvedActive =
          normalized.find((item) => item.id === storedId) || normalized[0] || null;

        if (resolvedActive) {
          persistActiveWorkspaceId(resolvedActive.id);
          setActiveWorkspace(resolvedActive);
        } else {
          clearWorkspaceState();
        }

        hasBootstrappedRef.current = true;
        lastBootKeyRef.current = bootKey;

        return normalized;
      } catch (err) {
        if (err?.status === 401) {
          hasBootstrappedRef.current = false;
          lastBootKeyRef.current = null;
          clearWorkspaceState();
          return [];
        }

        console.error("Failed to fetch workspaces", err);
        setError(err);
        setWorkspaces([]);
        setActiveWorkspace(null);

        return [];
      } finally {
        fetchInFlightRef.current = false;
        setLoading(false);
        setInitialized(true);
      }
    },
    [
      auth?.getToken,
      auth?.isLoaded,
      auth?.isSignedIn,
      auth?.userId,
      clearWorkspaceState,
      persistActiveWorkspaceId,
      workspaces,
    ]
  );

  useEffect(() => {
    if (!HAS_CLERK) {
      setInitialized(true);
      return;
    }

    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setActiveWorkspace(null);
      return;
    }

    const match = workspaces.find((item) => item.id === activeWorkspaceId) || null;
    setActiveWorkspace(match);
  }, [activeWorkspaceId, workspaces]);

  const refreshWorkspaces = useCallback(async () => {
    return fetchWorkspaces({ force: true });
  }, [fetchWorkspaces]);

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      workspaceId: activeWorkspaceId,
      currentWorkspaceId: activeWorkspaceId,
      loading,
      initialized,
      error,
      setActiveWorkspace: selectWorkspace,
      selectWorkspace,
      refreshWorkspaces,
    }),
    [
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      loading,
      initialized,
      error,
      selectWorkspace,
      refreshWorkspaces,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}

export default WorkspaceContext;
