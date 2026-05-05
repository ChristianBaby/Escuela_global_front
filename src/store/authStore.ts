import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string, remember?: boolean) => void;
  clearUser: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user, token, remember = false) => {
        const expires = remember ? 30 : 1;
        Cookies.set("access_token", token, { expires, secure: true, sameSite: "strict" });
        set({ user, isAuthenticated: true });
      },

      clearUser: () => {
        Cookies.remove("access_token");
        set({ user: null, isAuthenticated: false });
      },

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        const allowed = Array.isArray(roles) ? roles : [roles];
        return allowed.includes(user.role);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
