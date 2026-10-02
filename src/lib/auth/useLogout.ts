"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { authService } from "@/lib/services/auth";
import { clearLocalSession, replaceLocation } from "@/lib/auth/sessionClient";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const inFlight = useRef(false);

  const logout = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoggingOut(true);
    try {
      await authService.logout();
      clearLocalSession();
      replaceLocation("/auth/login");
    } catch {
      toast.error("No se pudo cerrar la sesión. Inténtalo de nuevo.");
      inFlight.current = false;
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
