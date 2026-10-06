import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProtectedPrefix } from "@/lib/auth/roleRoutes";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!getProtectedPrefix(pathname)) return NextResponse.next();

  // Comprobación preliminar. El backend valida la sesión y los permisos.
  if (request.cookies.has("access_token") || request.cookies.has("refresh_token")) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/panel",
    "/panel/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/mis-cursos",
    "/mis-cursos/:path*",
    "/mis-certificados",
    "/docentes",
    "/curso/:path*",
    "/perfil/:path*",
    "/notificaciones/:path*",
    "/certificado/:path*",
  ],
};
