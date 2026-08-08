import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearTokens, getAccessToken, getRefreshToken, setOnAuthExpired, setTokens } from "../lib/api";
import { mapUser } from "../lib/mappers";
import type { User } from "../types";

interface AuthResponse {
  access: string;
  refresh: string;
  user: unknown;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    setOnAuthExpired(() => {
      setCurrentUser(null);
    });
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!getRefreshToken()) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const me = await api.get<unknown>("/api/users/me/");
        setCurrentUser(mapUser(me));
      } catch {
        clearTokens();
        setCurrentUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/api/auth/login/", { email, password }, { auth: false });
    setTokens(res.access, res.refresh);
    setCurrentUser(mapUser(res.user));
  };

  const register = async (fullName: string, username: string, email: string, password: string) => {
    const res = await api.post<AuthResponse>(
      "/api/auth/register/",
      { full_name: fullName, username, email, password },
      { auth: false },
    );
    setTokens(res.access, res.refresh);
    setCurrentUser(mapUser(res.user));
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await api.post("/api/auth/logout/", { refresh });
    } catch {
      // best-effort — clear local state regardless
    }
    clearTokens();
    setCurrentUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!currentUser && !!getAccessToken(),
      isBootstrapping,
      currentUser,
      setCurrentUser,
      login,
      register,
      logout,
    }),
    [currentUser, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
