import type { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

let queryClient: QueryClient | null = null;
let redirecting = false;

export function loginDestination(pathname: string, search = "") {
  return `/auth/login?redirect=${encodeURIComponent(pathname + search)}`;
}

export function replaceLocation(destination: string) {
  window.location.replace(destination);
}

export function registerSessionQueryClient(client: QueryClient) {
  queryClient = client;
}

export function clearLocalSession() {
  useAuthStore.getState().clearUser();
  queryClient?.clear();
  useCartStore.getState().clearCart();
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/auth/login" || redirecting) return;
  redirecting = true;
  replaceLocation(loginDestination(window.location.pathname, window.location.search));
}

export function handleInvalidSession() {
  clearLocalSession();
  redirectToLogin();
}
