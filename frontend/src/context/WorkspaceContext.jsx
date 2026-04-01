import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth, HAS_CLERK } from "../hooks/useAuth";

const WorkspaceContext = createContext(null);

const STORAGE_KEYS = {
  activeWorkspaceId: "activeWorkspaceId",
  workspaceId: "workspaceId",
  workspaceData: "activeWorkspaceData",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const BASE_URL = normalizeBaseUrl(API_BASE_URL);

function buildUrl(path) {
  if (!path.startsWith("/")) {
    return `${BASE_URL}/${path}`;
  }
  return `${BASE_URL}${path}`;
}

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

function parseStoredJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse stored workspace JSON", error);
    return fallback;
  }
}

function normalizeWorkspace(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id =
    raw.id ||
    raw.workspace_id ||
    raw.workspaceId ||
    null;

  if (!id) return null;

  return {
    id: String(id),
    workspace_id: String(id),
    name: raw.name || raw.workspace_name || "Workspace",
    status: raw.status || "active",
    role: raw.role || raw.workspace_role || null,
    owner_id: raw.owner_id || null,
    plan_id: raw.plan_id || null,
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

function getStoredWorkspaceData() {
  return parseStoredJson(safeGetStorage(STORAGE_KEYS.workspaceData), null);
}

export function WorkspaceProvider({ children }) {
  const auth = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(
    () => getStoredWorkspaceId()
  );
  const [activeWorkspace, setActiveWorkspace] = useState(() =>
    normalizeWorkspace(getStoredWorkspaceData())
  );
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const clearWorkspaceState = useCallback(() => {
    safeRemoveStorage(STORAGE_KEYS.activeWorkspaceId);
    safeRemoveStorage(STORAGE_KEYS.workspaceId);
    safeRemoveStorage(STORAGE_KEYS.workspaceData);
    setWorkspaces([]);
    setActiveWorkspaceIdState(null);
    setActiveWorkspace(null);
  }, []);

  const persistActiveWorkspace = useCallback((workspace) => {
    const normalized = normalizeWorkspace(workspace);

    if (!normalized) {
      clearWorkspaceState();
      return;
    }

    safeSetStorage(STORAGE_KEYS.activeWorkspaceId, normalized.id);
    safeSetStorage(STORAGE_KEYS.workspaceId, normalized.id);
    safeSetStorage(STORAGE_KEYS.workspaceData, JSON.stringify(normalized));

    setActiveWorkspaceIdState(normalized.id);
    setActiveWorkspace(normalized);
  }, [clearWorkspaceState]);

  const selectWorkspace = useCallback((workspaceOrId) => {
    if (!workspaceOrId) {
      clearWorkspaceState();
      return;
    }

    if (typeof workspaceOrId === "string") {
      const match = workspaces.find((item) => item.id === workspaceOrId);
      if (match) {
        persistActiveWorkspace(match);
        return;
      }

      safeSetStorage(STORAGE_KEYS.activeWorkspaceId, workspaceOrId);
      safeSetStorage(STORAGE_KEYS.workspaceId, workspaceOrId);
      setActiveWorkspaceIdState(String(workspaceOrId));
      return;
    }

    persistActiveWorkspace(workspaceOrId);
  }, [clearWorkspaceState, persistActiveWorkspace, workspaces]);

  const fetchWorkspaces = useCallback(async () => {
    if (!HAS_CLERK) {
      setInitialized(true);
      setLoading(false);
      return [];
    }

    if (!auth?.isLoaded) {
      return [];
    }

    if (!auth?.isSignedIn) {
      clearWorkspaceState();
      setInitialized(true);
      setLoading(false);
      return [];
    }

    if (typeof auth.getToken !== "function") {
      setInitialized(true);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const token = await auth.getToken();

      if (!token) {
        throw new Error("No Clerk session token available");
      }

      const response = await fetch(buildUrl("/api/workspaces/mine"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      let payload = null;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      if (!response.ok) {
        const detail =
          (payload && typeof payload === "object" && (payload.detail || payload.message)) ||
          `Failed to fetch workspaces (${response.status})`;
        throw new Error(detail);
      }

      const rawItems =
        payload?.workspaces ||
        payload?.items ||
        payload?.data ||
        [];

      const normalized = Array.isArray(rawItems)
        ? rawItems.map(normalizeWorkspace).filter(Boolean)
        : [];

      setWorkspaces(normalized);

      const storedId = getStoredWorkspaceId();
      const resolvedActive =
        normalized.find((item) => item.id === storedId) ||
        normalized[0] ||
        null;

      if (resolvedActive) {
        persistActiveWorkspace(resolvedActive);
      } else {
        clearWorkspaceState();
      }

      return normalized;
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
      setError(err);
      setWorkspaces([]);

      const storedWorkspace = normalizeWorkspace(getStoredWorkspaceData());
      if (storedWorkspace) {
        setActiveWorkspace(storedWorkspace);
        setActiveWorkspaceIdState(storedWorkspace.id);
      }

      return [];
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [auth, clearWorkspaceState, persistActiveWorkspace]);

  useEffect(() => {
    if (!HAS_CLERK) {
      setInitialized(true);
      return;
    }

    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const refreshWorkspaces = useCallback(async () => {
    return fetchWorkspaces();
  }, [fetchWorkspaces]);

  const value = useMemo(() => {
    return {
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
    };
  }, [
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    loading,
    initialized,
    error,
    selectWorkspace,
    refreshWorkspaces,
  ]);

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
