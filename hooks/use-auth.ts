"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ApiError, apiFetch } from "@/lib/api/client";
import { authStore, type AuthUser } from "@/lib/auth/store";

interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
}

function getSnapshot() {
  return authStore.getToken();
}

function getServerSnapshot() {
  return null;
}

export function useAuth() {
  const token = useSyncExternalStore(
    (cb) => authStore.subscribe(cb),
    getSnapshot,
    getServerSnapshot
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(authStore.getUser());
    setHydrated(true);
  }, [token]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        const data = await apiFetch<LoginResponse>("news", "/auth/login", {
          method: "POST",
          auth: false,
          body: { email, password },
        });
        authStore.set(data.access_token, data.user);
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError) {
          return { ok: false, error: err.message };
        }
        return { ok: false, error: "Network error. Try again." };
      }
    },
    []
  );

  const logout = useCallback(() => {
    authStore.clear();
  }, []);

  return {
    token,
    user,
    isAuthenticated: !!token,
    hydrated,
    login,
    logout,
  };
}
