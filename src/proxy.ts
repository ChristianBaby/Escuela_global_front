// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard": ["estudiante"],
  "/curso": ["estudiante"],
  "/carrito": ["estudiante"],
  "/checkout": ["estudiante"],
  "/pedido": ["estudiante"],
  "/perfil": ["estudiante", "soporte", "marketing", "admin"],
  "/notificaciones": ["estudiante", "soporte", "marketing", "admin"],
  "/certificado": ["estudiante"],
  "/soporte": ["soporte", "admin"],
  "/marketing": ["marketing", "admin"],
  "/admin": ["admin"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Buscar si la ruta actual está protegida
  const protectedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  );

  // Si no está protegida, continuar
  if (!protectedPrefix) {
    return NextResponse.next();
  }

  // Obtener token
  const token = request.cookies.get("access_token")?.value;

  // Si no hay token → login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);

    // Guardar a dónde quería ir
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decodificar JWT
    const payloadBase64 = token.split(".")[1];
    // Compatibilidad Edge Runtime
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    const userRole = payload.role;
    const allowedRoles = ROLE_ROUTES[protectedPrefix]; 
    // Roles permitidos para esa ruta

    // Validar rol
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(
        new URL("/acceso-denegado", request.url)
      );
    }

    // Si ya está logueado y entra al login
    if (pathname === "/auth/login") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.next();

  } catch (error) {
    // Token inválido/corrupto
    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );

    // Opcional: limpiar cookie dañada
    response.cookies.delete("access_token");

    return response;
  }
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
    "/auth/login",
  ],
};
