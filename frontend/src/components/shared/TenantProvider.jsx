/**
 * TenantProvider.jsx
 * Core Truth House OS — Tenant Isolation Context
 *
 * Ensures every user only sees and modifies data for their active workspace.
 * Works alongside the backend middleware to enforce isolation.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useWorkspace } from '../../context/WorkspaceContext';

const API = import.meta.env.VITE_BACKEND_URL;

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The workspace_id we'll attach to every API request
  const workspaceId = activeWorkspace?.workspace_id || activeWorkspace?.id || null;

  useEffect(() => {
    if (workspaceId) {
      setLoading(false);
    } else {
      // Wait for workspace to be set
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [workspaceId]);

  // Create an axios instance that auto-includes the workspace header
  const tenantApi = useMemo(() => {
    const instance = axios.create({ baseURL: API });

    // Request interceptor — attach workspace header
    instance.interceptors.request.use(
      (config) => {
        if (workspaceId) {
          config.headers['X-Workspace-ID'] = workspaceId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor — handle 403 tenant isolation errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          const msg = error.response?.data?.detail || '';
          if (msg.includes('workspace') || msg.includes('tenant')) {
            console.error('[TenantGuard] Access denied to another workspace');
            setError('You do not have access to this workspace.');
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [workspaceId]);

  const value = {
    workspaceId,
    loading,
    error,
    api: tenantApi,
    clearError: () => setError(null),
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    // Return a fallback for components outside TenantProvider
    return {
      workspaceId: null,
      loading: false,
      error: null,
      api: axios.create({ baseURL: API }),
      clearError: () => {},
    };
  }
  return ctx;
}

/**
 * useTenantApi - Returns an axios instance that auto-includes workspace headers
 */
export function useTenantApi() {
  const { api } = useTenant();
  return api;
}

// ─────────────────────────────────────────────────────────────
// GUARD COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * TenantGuard
 * Renders children only if the user is in a valid workspace context.
 * Shows loading/error states otherwise.
 */
export function TenantGuard({ children, fallback = null }) {
  const { workspaceId, loading, error } = useTenant();

  // Still loading workspace
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 border-2 border-[#E04E35]/30 border-t-[#E04E35] rounded-full animate-spin" />
        </div>
      )
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-white font-medium mb-2">Access Denied</p>
        <p className="text-white/50 text-sm">{error}</p>
      </div>
    );
  }

  // No workspace selected
  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-white font-medium mb-2">No Workspace Selected</p>
        <p className="text-white/50 text-sm">Please select a workspace to continue.</p>
      </div>
    );
  }

  return children;
}

export default TenantProvider;
