/**
 * API client for whippie-web.
 *
 * Token strategy (matches the API contract):
 *   - Access token (15min JWT) stored in module-level memory — never localStorage.
 *   - Refresh token lives in an HTTP-only cookie — the browser sends it automatically.
 *   - On a 401 response the client attempts one silent refresh, then redirects to /login.
 */

const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000";

// ─── In-memory access token ───────────────────────────────────────────────────
// Stored at module scope so it survives re-renders but is cleared on page reload.
// That is intentional — page reload forces a silent refresh via the cookie.

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
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

/**
 * Apply per-field API validation errors to a react-hook-form instance.
 * Falls back to a no-op when no field errors are present.
 *
 * Usage inside mutation onError:
 *   if (err instanceof ApiError) applyApiErrors(err, form.setError);
 */
export function applyApiErrors(
  err: ApiError,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // Deduplicate concurrent refresh calls
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the refresh cookie
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
      // Refresh failed — redirect to login (only in browser)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
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
