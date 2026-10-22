"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiPost,
  apiGet,
  setAccessToken,
  setAuthFailureHandler,
} from "@/lib/api/client";
import type { UserRole, AccountStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: AccountStatus;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user,       setUser]       = useState<AuthUser | null>(null);
  const [hasToken,   setHasToken]   = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const initialised                 = useRef(false);

  // Helper: set both the module-level token AND the React state flag atomically
  const storeToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setHasToken(token !== null);
  }, []);

  // Clear everything and redirect to /login — used when the API client
  // detects the session has expired (401 after failed refresh).
  const handleAuthFailure = useCallback(() => {
    storeToken(null);
    setUser(null);
    setIsLoading(false);
    router.replace("/login");
  }, [storeToken, router]);

  // Register the failure handler with the API client
  useEffect(() => {
    setAuthFailureHandler(handleAuthFailure);
    return () => setAuthFailureHandler(null);
  }, [handleAuthFailure]);

  // Restore session on mount — silent refresh via HTTP-only cookie
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    async function restoreSession() {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) return;

        const refreshBody = (await refreshRes.json()) as {
          data?: { accessToken?: string };
        };
        const token = refreshBody.data?.accessToken;
        if (!token) return;

        // Store token — both module level and React state
        storeToken(token);

        // Fetch user profile with a raw fetch — bypasses the API client's
        // 401-retry logic to avoid silent-refresh loops during restore.
        const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!meRes.ok) {
          storeToken(null);
          return;
        }

        const meBody = (await meRes.json()) as { data?: { user: AuthUser } };
        if (meBody.data?.user) {
          setUser(meBody.data.user);
        } else {
          storeToken(null);
        }
      } catch {
        storeToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [storeToken]);

  const login = useCallback(async (input: LoginInput) => {
    const res = await apiPost<{ data: { accessToken: string; user: AuthUser } }>(
      "/api/v1/auth/login",
      input
    );
    storeToken(res.data.accessToken);
    setUser(res.data.user);
  }, [storeToken]);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/v1/auth/logout");
    } catch {
      // best effort
    } finally {
      storeToken(null);
      setUser(null);
    }
  }, [storeToken]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiGet<{ data: { user: AuthUser } }>("/api/v1/auth/me");
      if (res.data?.user) setUser(res.data.user);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null && hasToken,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
