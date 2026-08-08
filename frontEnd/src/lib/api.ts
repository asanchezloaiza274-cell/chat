export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const REFRESH_TOKEN_KEY = "loop:refresh_token";

let accessToken: string | null = null;
let onAuthExpired: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setOnAuthExpired(fn: () => void) {
  onAuthExpired = fn;
}

export function setTokens(access: string, refresh?: string) {
  accessToken = access;
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

function extractErrorMessage(data: unknown): string {
  if (typeof data === "string" && data) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    const firstKey = Object.keys(obj)[0];
    if (firstKey) {
      const value = obj[firstKey];
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      if (typeof value === "string") return value;
    }
  }
  return "Something went wrong";
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = getRefreshToken();
      if (!refresh) return null;
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        setTokens(data.access, data.refresh);
        return data.access as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}, allowRetry = true): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string> | undefined) };
  if (!isFormData && body != null && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth && accessToken) {
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders, body });

  if (res.status === 401 && auth && allowRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, false);
    }
    clearTokens();
    onAuthExpired?.();
    throw new ApiError(401, null, "Your session has expired");
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, data, extractErrorMessage(data));
  }
  return data as T;
}

function jsonBody(body?: unknown): BodyInit | null | undefined {
  if (body === undefined) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  return JSON.stringify(body);
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body: jsonBody(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: jsonBody(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
