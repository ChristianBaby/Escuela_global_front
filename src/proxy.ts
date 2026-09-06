import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard":           ["estudiante"],
  "/mis-cursos":          ["estudiante"],
  "/curso/":              ["estudiante"],
  "/pedido":              ["estudiante"],
  "/perfil":              ["estudiante", "soporte", "marketing", "admin", "coordinador"],
  "/notificaciones":      ["estudiante", "soporte", "marketing", "admin", "coordinador"],
  "/certificado":         ["estudiante"],
  "/panel/soporte":       ["soporte", "admin"],
  "/panel/marketing":     ["marketing", "admin"],
  "/panel/coordinador":   ["coordinador", "admin"],
  "/panel/estudiantes":   ["admin", "soporte", "coordinador"],
  "/panel/auditoria":     ["admin"],
  "/panel/cursos":        ["admin", "coordinador"],
  "/panel":               ["admin", "soporte", "marketing", "coordinador"],
};

// Rutas más específicas primero
const ROUTE_PREFIXES = [
  "/panel/soporte",
  "/panel/marketing",
  "/panel/coordinador",
  "/panel/estudiantes",
  "/panel/auditoria",
  "/panel/cursos",
  "/panel",
  "/dashboard",
  "/mis-cursos",
  "/curso/",
  "/pedido",
  "/perfil",
  "/notificaciones",
  "/certificado",
];

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

// El access_token dura solo 5 minutos (ver AuthGuard en el backend). Si ya
// venció pero el refresh_token (7 días) sigue vivo, no tiene sentido cortar
// la navegación: el propio AuthGuard renueva el access_token de forma
// transparente en la primera llamada a la API que haga la página destino.
// Este middleware nunca verifica la firma (no tiene el secreto), solo decodifica
// el payload para leer el rol — la verificación real ocurre en el backend.
function getSessionPayload(request: NextRequest): Record<string, unknown> | null {
  const accessToken = request.cookies.get("access_token")?.value;
  if (accessToken) {
    try {
      return decodeJwtPayload(accessToken);
    } catch {
      // Vencido o inválido: seguimos con el refresh_token.
    }
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (refreshToken) {
    try {
      return decodeJwtPayload(refreshToken);
    } catch {
      return null;
    }
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Siempre permitir acceso al login (necesario para que el logout funcione correctamente)
  if (pathname === "/auth/login") {
    return NextResponse.next();
  }

  const protectedPrefix = ROUTE_PREFIXES.find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!protectedPrefix) return NextResponse.next();

  const payload = getSessionPayload(request);

  if (!payload) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    return response;
  }

  const userRole = payload.role as string;
  const allowedRoles = ROLE_ROUTES[protectedPrefix];

  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL("/sin-acceso", request.url));
  }

  return NextResponse.next();
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
    "/pedido/:path*",
    "/perfil/:path*",
    "/notificaciones/:path*",
    "/certificado/:path*",
  ],
};
