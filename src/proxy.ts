import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard":   ["estudiante"],
  "/curso":       ["estudiante"],
  "/carrito":     ["estudiante"],
  "/checkout":    ["estudiante"],
  "/pedido":      ["estudiante"],
  "/perfil":      ["estudiante", "soporte", "marketing", "admin"],
  "/notificaciones": ["estudiante", "soporte", "marketing", "admin"],
  "/certificado": ["estudiante"],
  "/soporte":     ["soporte", "admin"],
  "/marketing":   ["marketing", "admin"],
  "/admin":       ["admin"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!protectedPrefix) return NextResponse.next();

  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/curso/:path*",
    "/carrito/:path*",
    "/checkout/:path*",
    "/pedido/:path*",
    "/perfil/:path*",
    "/notificaciones/:path*",
    "/certificado/:path*",
    "/soporte/:path*",
    "/marketing/:path*",
    "/admin/:path*",
  ],
};
