import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard":           ["estudiante"],
  "/mis-cursos":          ["estudiante"],
  "/curso":               ["estudiante"],
  "/checkout":            ["estudiante"],
  "/pedido":              ["estudiante"],
  "/perfil":              ["estudiante", "soporte", "marketing", "admin"],
  "/notificaciones":      ["estudiante", "soporte", "marketing", "admin"],
  "/certificado":         ["estudiante"],
  "/panel/soporte":       ["soporte", "admin"],
  "/panel/marketing":     ["marketing", "admin"],
  "/panel/estudiantes":   ["admin"],
  "/panel/auditoria":     ["admin"],
  "/panel/cursos":        ["admin"],
  "/panel":               ["admin", "soporte", "marketing"],
};

// Rutas más específicas primero
const ROUTE_PREFIXES = [
  "/panel/soporte",
  "/panel/marketing",
  "/panel/estudiantes",
  "/panel/auditoria",
  "/panel/cursos",
  "/panel",
  "/dashboard",
  "/mis-cursos",
  "/curso",
  "/checkout",
  "/pedido",
  "/perfil",
  "/notificaciones",
  "/certificado",
];

const ROLE_HOME: Record<string, string> = {
  admin:      "/panel",
  soporte:    "/panel/soporte/cursos",
  marketing:  "/panel/marketing/publicaciones",
  estudiante: "/dashboard",
};

// JWT usa base64url: reemplazar - por + y _ por / antes de atob
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split(".")[1];
  if (!base64Url) throw new Error("Token inválido");
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const payload = JSON.parse(atob(padded));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expirado");
  }
  return payload;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Después — no redirigir si viene de logout
  if (pathname === "/auth/login") {
    const token = request.cookies.get("access_token")?.value;
    if (token) {
      try {
        const payload = decodeJwtPayload(token);
        const home = ROLE_HOME[payload.role as string] ?? "/auth/login";
        return NextResponse.redirect(new URL(home, request.url));
      } catch {
        // Token expirado o corrupto — limpiar cookie y mostrar login
        const response = NextResponse.next();
        response.cookies.delete("access_token");
        return response;
      }
    }
    return NextResponse.next();
  }

  const protectedPrefix = ROUTE_PREFIXES.find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!protectedPrefix) return NextResponse.next();

  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = decodeJwtPayload(token);
    const userRole = payload.role as string;
    const allowedRoles = ROLE_ROUTES[protectedPrefix];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/sin-acceso", request.url));
    }

    return NextResponse.next();
  } catch {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("access_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/auth/login",
    "/panel",
    "/panel/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/mis-cursos",
    "/mis-cursos/:path*",
    "/curso/:path*",
    "/checkout/:path*",
    "/pedido/:path*",
    "/perfil/:path*",
    "/notificaciones/:path*",
    "/certificado/:path*",
  ],
};
