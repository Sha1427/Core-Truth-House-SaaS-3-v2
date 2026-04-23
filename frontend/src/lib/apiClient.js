// frontend/src/lib/apiClient.js

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function normalizeBaseUrl(rawValue) {
  const raw = String(rawValue || "").trim();

  if (!raw || raw === "undefined" || raw === "null") {
    return "";
  }

  if (isAbsoluteUrl(raw)) {
    return raw.replace(/\/+$/, "");
  }

  let normalized = raw;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized.replace(/\/+$/, "");
}

function normalizePath(path) {
  const raw = String(path || "").trim();

  if (!raw) {
    throw new Error("API path is required.");
  }

  if (isAbsoluteUrl(raw)) {
    return raw;
  }

  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/");
}

function buildUrl(baseUrl, path) {
  const normalizedPath = normalizePath(path);

  if (isAbsoluteUrl(normalizedPath)) {
    return normalizedPath;
  }

  const normalizedBase = normalizeBaseUrl(baseUrl);

  if (!normalizedBase) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function safeJson(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return {
      __nonJson: true,
      text,
    };
  }

  try {
    return await response.json();
  } catch (error) {
    return {
      __invalidJson: true,
      error: error instanceof Error ? error.message : "Invalid JSON response",
    };
  }
}

function extractErrorMessage(payload, fallback) {
  if (!payload) return fallback;

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload?.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (payload?.__nonJson && typeof payload.text === "string" && payload.text.trim()) {
    return payload.text;
  }

  return fallback;
}

class ApiClient {
  constructor() {
    this.getToken = async () => null;
    this.getWorkspaceId = async () => null;
    this.onUnauthorized = async () => {};
    this.onForbidden = async () => {};

    this.baseUrl = this.resolveBaseUrl();
  }

  resolveBaseUrl() {
    const candidates = [
      typeof import.meta !== "undefined" ? import.meta?.env?.VITE_API_BASE_URL : undefined,
      typeof import.meta !== "undefined" ? import.meta?.env?.VITE_BACKEND_URL : undefined,
      typeof process !== "undefined" ? process?.env?.REACT_APP_API_BASE_URL : undefined,
      typeof process !== "undefined" ? process?.env?.REACT_APP_BACKEND_URL : undefined,
      typeof window !== "undefined" ? window.__API_BASE_URL__ : undefined,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeBaseUrl(candidate);
      if (normalized) return normalized;
    }

    return "";
  }

  configure({
    getToken,
    getWorkspaceId,
    onUnauthorized,
    onForbidden,
    baseUrl,
  } = {}) {
    if (typeof getToken === "function") {
      this.getToken = getToken;
    }

    if (typeof getWorkspaceId === "function") {
      this.getWorkspaceId = getWorkspaceId;
    }

    if (typeof onUnauthorized === "function") {
      this.onUnauthorized = onUnauthorized;
    }

    if (typeof onForbidden === "function") {
      this.onForbidden = onForbidden;
    }

    if (baseUrl !== undefined) {
      this.baseUrl = normalizeBaseUrl(baseUrl);
    }

    return this;
  }

  buildApiUrl(path) {
    return buildUrl(this.baseUrl, path);
  }

  async getAuthHeaders(options = {}) {
    const headers = new Headers(options.headers || {});

    if (!options.isFormData && !headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    if (
      !options.isFormData &&
      options.body !== undefined &&
      options.body !== null &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    const token = await this.getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const includeWorkspace = options.workspace !== false;
    if (includeWorkspace) {
      const workspaceId = await this.getWorkspaceId();
      if (workspaceId && !headers.has("X-Workspace-ID")) {
        headers.set("X-Workspace-ID", String(workspaceId));
      }
    }

    return Object.fromEntries(headers.entries());
  }

  async buildHeaders(options = {}) {
    const rawHeaders = await this.getAuthHeaders({
      headers: options.headers,
      body: options.body,
      isFormData: options.body instanceof FormData,
      workspace: options.workspace,
    });

    return new Headers(rawHeaders);
  }

  async request(method, path, options = {}) {
    const queryString = buildQueryString(options.params || {});
    const url = this.buildApiUrl(path) + queryString;

    const headers = await this.buildHeaders(options);

    const init = {
      method,
      headers,
      credentials: options.credentials || "include",
    };

    if (options.signal) {
      init.signal = options.signal;
    }

    if (options.body !== undefined && options.body !== null) {
      if (options.body instanceof FormData) {
        init.body = options.body;
      } else if (typeof options.body === "string") {
        init.body = options.body;
      } else {
        init.body = JSON.stringify(options.body);
      }
    }

    let response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Network request failed.";

      throw new Error(message);
    }

    const payload = await safeJson(response);

    if (response.status === 401) {
      try {
        await this.onUnauthorized({
          status: response.status,
          url,
          payload,
        });
      } catch (error) {
        console.error("Unauthorized handler failed", error);
      }
    }

    if (response.status === 403) {
      try {
        await this.onForbidden({
          status: response.status,
          url,
          payload,
        });
      } catch (error) {
        console.error("Forbidden handler failed", error);
      }
    }

    if (!response.ok) {
      const fallback = `Request failed with status ${response.status}`;
      const message = extractErrorMessage(payload, fallback);
      const err = new Error(message);
      err.status = response.status;
      err.payload = payload;
      err.url = url;
      throw err;
    }

    if (payload?.__nonJson) {
      return payload.text;
    }

    return payload;
  }

  async get(path, options = {}) {
    return this.request("GET", path, options);
  }

  async post(path, body, options = {}) {
    return this.request("POST", path, { ...options, body });
  }

  async put(path, body, options = {}) {
    return this.request("PUT", path, { ...options, body });
  }

  async patch(path, body, options = {}) {
    return this.request("PATCH", path, { ...options, body });
  }

  async delete(path, options = {}) {
    return this.request("DELETE", path, options);
  }
}

const apiClient = new ApiClient();

export { ApiClient, buildQueryString, buildUrl, normalizeBaseUrl, normalizePath };

export function configureApiClient({
  getAuthToken,
  getWorkspaceId,
  onUnauthorized,
  onForbidden,
  baseUrl,
} = {}) {
  apiClient.configure({
    getToken: getAuthToken,
    getWorkspaceId,
    onUnauthorized,
    onForbidden,
    baseUrl,
  });
}

export default apiClient;
