"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import { canAccess, getLandingForRole } from "@/lib/auth/roleRoutes";
import { useAuthStore } from "@/store/authStore";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const storedUser = useAuthStore((state) => state.user);
  const { data: user, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["session", pathname],
    queryFn: ({ signal }) => authService.me(signal),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const validatedUser = !isFetching && !isError ? user : undefined;
  const allowed = !!validatedUser && canAccess(pathname, validatedUser.role);

  useEffect(() => {
    if (!validatedUser) return;
    setUser(validatedUser);
    if (allowed) return;

    if (pathname === "/perfil" && validatedUser.role !== "estudiante") {
      router.replace("/panel/perfil");
    } else if (pathname === "/panel" && validatedUser.role !== "estudiante") {
      router.replace(getLandingForRole(validatedUser.role));
    } else {
      router.replace("/sin-acceso");
    }
  }, [validatedUser, allowed, pathname, router, setUser]);

  if (isFetching || (!isError && !validatedUser)) {
    return <div className="flex min-h-screen items-center justify-center" role="status">Validando sesión…</div>;
  }

  if (isError) {
    // El interceptor gestiona el 401 y la redirección al login.
    if ((error as { response?: { status?: number } })?.response?.status === 401) return null;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="alert">
        <p>No se pudo validar tu sesión.</p>
        <button type="button" onClick={() => refetch()} className="text-[#084D95] underline">Reintentar</button>
      </div>
    );
  }

  // No montar consultas de la página hasta que el store tenga al usuario validado.
  return allowed && storedUser?.id === validatedUser?.id && storedUser.role === validatedUser.role
    ? <>{children}</>
    : null;
}
