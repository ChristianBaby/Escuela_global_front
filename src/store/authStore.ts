import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateUser: (updated: Partial<User>) => void;
  clearUser: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (updated) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updated } : null,
        }));
      },

      clearUser: () => {
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
