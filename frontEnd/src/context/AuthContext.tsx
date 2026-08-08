import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser } from "../data/mock/users";
import type { User } from "../types";

interface AuthContextValue {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "chat-app:auth";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  const login = async (email: string, password: string) => {
    await delay(900);
    if (!email.includes("@") || password.length < 4) {
      throw new Error("Invalid email or password");
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setIsAuthenticated(true);
  };

  const register = async (_fullName: string, _username: string, email: string, password: string) => {
    await delay(1100);
    if (!email.includes("@") || password.length < 6) {
      throw new Error("Please check your information and try again");
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      currentUser: isAuthenticated ? getCurrentUser() : null,
      login,
      register,
      logout,
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
