"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiPost, setAccessToken, getAccessToken } from "@/lib/api/client";
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

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;   // true while the initial silent refresh runs
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, attempt a silent refresh to restore the session from the cookie.
  // If the cookie is missing or expired, isLoading becomes false with user = null.
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch(
          `${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000"}/api/v1/auth/refresh`,
          { method: "POST", credentials: "include" }
        );

        if (res.ok) {
          const body = (await res.json()) as {
            data?: { accessToken?: string; user?: AuthUser };
          };
          const token = body.data?.accessToken;
          const userData = body.data?.user;
          if (token && userData) {
            setAccessToken(token);
            setUser(userData);
          }
        }
      } catch {
        // No session — user needs to log in
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await apiPost<{
      data: { accessToken: string; user: AuthUser };
    }>("/api/v1/auth/login", input);

    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/v1/auth/logout");
    } catch {
      // best effort — clear client state regardless
    } finally {
      setAccessToken(null);
      setUser(null);
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
