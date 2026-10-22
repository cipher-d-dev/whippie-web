/**
 * API client for whippie-web.
 *
 * Token strategy (matches the API contract):
 *   - Access token (15min JWT) stored in module-level memory — never localStorage.
 *   - Refresh token lives in an HTTP-only cookie — the browser sends it automatically.
 *   - On a 401 response the client attempts one silent refresh, then clears the
 *     auth state via the registered failure handler so the AuthProvider can
 *     redirect cleanly with router.replace() — no full-page reload.
 */

const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000";

// ─── In-memory access token ───────────────────────────────────────────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ─── Auth failure handler ─────────────────────────────────────────────────────
// Set by the AuthProvider so the client can clear React auth state (not just
// the module-level token) when the session expires. This avoids full-page
// reloads that cause infinite redirect loops.

type AuthFailureHandler = () => void;
let _authFailureHandler: AuthFailureHandler | null = null;

export function setAuthFailureHandler(handler: AuthFailureHandler | null) {
  _authFailureHandler = handler;
}

// ─── Error class ──────────────────────────────────────────────────────────────

export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: ApiFieldError[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function applyApiErrors(
  err: ApiError,
  setError: (field: string, error: { type: string; message: string }) => void
): void {
  if (!err.errors?.length) return;
  for (const { field, message } of err.errors) {
    setError(field, { type: "server", message });
  }
}

// ─── Response handler ─────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let errors: ApiFieldError[] | undefined;
    try {
      const body = (await response.json()) as {
        message?: string;
        errors?: ApiFieldError[];
      };
      if (body.message) message = body.message;
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        errors = body.errors;
      }
    } catch {
      // ignore JSON parse failures
    }
    throw new ApiError(message, response.status, errors);
  }
  return response.json() as Promise<T>;
}

// ─── Silent refresh ───────────────────────────────────────────────────────────

let _refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        setAccessToken(null);
        return false;
      }

      const body = (await res.json()) as { data?: { accessToken?: string } };
      const token = body.data?.accessToken;
      if (token) {
        setAccessToken(token);
        return true;
      }
      return false;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const makeHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json", ...headers };
    if (_accessToken) h["Authorization"] = `Bearer ${_accessToken}`;
    return h;
  };

  const makeInit = (): RequestInit => ({
    method,
    credentials: "include",
    headers: makeHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let response = await fetch(`${API_BASE}${path}`, makeInit());

  // One silent retry on 401 — token may have expired
  if (response.status === 401 && _accessToken !== null) {
    const refreshed = await silentRefresh();

    if (refreshed) {
      response = await fetch(`${API_BASE}${path}`, makeInit());
    } else {
      // Refresh failed — notify the AuthProvider so it can clear React state
      // and redirect via router.replace() instead of a full-page reload.
      if (_authFailureHandler) {
        _authFailureHandler();
      }
      throw new ApiError("Session expired. Please log in again.", 401);
    }
  }

  return handleResponse<T>(response);
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
