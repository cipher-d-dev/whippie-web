"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiPost, apiGet, setAccessToken, getAccessToken } from "@/lib/api/client";
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
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialised               = useRef(false);

  // Restore session on mount.
  // /auth/refresh returns only accessToken — then we call /auth/me for the user.
  useEffect(() => {
    // Guard against double-invocation in React Strict Mode
    if (initialised.current) return;
    initialised.current = true;

    async function restoreSession() {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) return; // No active session — proceed to login

        const refreshBody = (await refreshRes.json()) as {
          data?: { accessToken?: string };
        };
        const token = refreshBody.data?.accessToken;
        if (!token) return;

        setAccessToken(token);

        // Fetch current user profile
        const meBody = await apiGet<{ data: { user: AuthUser } }>("/api/v1/auth/me");
        if (meBody.data?.user) {
          setUser(meBody.data.user);
        }
      } catch {
        // Session restore failed — clear any stale token
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await apiPost<{ data: { accessToken: string; user: AuthUser } }>(
      "/api/v1/auth/login",
      input
    );
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/v1/auth/logout");
    } catch {
      // best effort
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  // Allows components to re-fetch the current user (e.g. after profile update)
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
        isAuthenticated: user !== null && getAccessToken() !== null,
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
