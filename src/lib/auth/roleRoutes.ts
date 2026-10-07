import type { UserRole } from "@/types";

// Compartido entre proxy.ts (edge) y el cliente: no importar nada de React ni del store.

export const ROLE_LANDING: Record<UserRole, string> = {
  estudiante:  "/dashboard",
  soporte:     "/panel/soporte/cursos",
  marketing:   "/panel/marketing/publicaciones",
  admin:       "/panel",
  coordinador: "/panel/estudiantes",
};

export function getLandingForRole(role?: string | null): string {
  return ROLE_LANDING[role as UserRole] ?? "/dashboard";
}

export const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/dashboard":           ["estudiante"],
  "/mis-cursos":          ["estudiante"],
  "/mis-certificados":    ["estudiante"],
  "/docentes":            ["estudiante"],
  "/curso/":              ["estudiante"],
  "/perfil":              ["estudiante"],
  "/notificaciones":      ["estudiante"],
  "/certificado":         ["estudiante"],
  "/panel/soporte":       ["soporte", "admin"],
  "/panel/marketing":     ["marketing", "admin"],
  "/panel/coordinador":   ["coordinador", "admin"],
  "/panel/estudiantes":   ["admin", "soporte", "coordinador"],
  "/panel/auditoria":     ["admin"],
  "/panel/cursos":        ["admin", "coordinador"],
  "/panel/":              ["admin", "soporte", "marketing", "coordinador"],
  "/panel":               ["admin"], // ruta exacta: dashboard con KPIs
};

// Rutas más específicas primero
const ROUTE_PREFIXES = [
  "/panel/soporte",
  "/panel/marketing",
  "/panel/coordinador",
  "/panel/estudiantes",
  "/panel/auditoria",
  "/panel/cursos",
  "/panel/",
  "/dashboard",
  "/mis-cursos",
  "/mis-certificados",
  "/docentes",
  "/curso/",
  "/perfil",
  "/notificaciones",
  "/certificado",
];

/** Prefijo protegido que aplica a `pathname`, o null si la ruta es pública. */
export function getProtectedPrefix(pathname: string): string | null {
  if (pathname === "/panel") return "/panel";
  return ROUTE_PREFIXES.find((prefix) => pathname.startsWith(prefix)) ?? null;
}

export function canAccess(pathname: string, role?: string | null): boolean {
  const prefix = getProtectedPrefix(pathname);
  if (!prefix) return true;
  return !!role && ROLE_ROUTES[prefix].includes(role as UserRole);
}

/** Ruta interna del sitio (no "//host" ni "/\\host", que el navegador trata como externas). */
export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

/**
 * Destino tras el login: el `?redirect=` si es una ruta interna que el rol
 * puede ver, si no la landing del rol. Evita open redirects ("//evil.com").
 */
export function resolvePostLoginPath(redirect: string | null, role?: string | null): string {
  if (
    redirect &&
    isSafeInternalPath(redirect) &&
    !redirect.startsWith("/auth/") &&
    canAccess(redirect.split(/[?#]/)[0], role)
  ) {
    return redirect;
  }
  return getLandingForRole(role);
}
