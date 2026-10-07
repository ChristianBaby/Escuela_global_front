import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProtectedPrefix } from "@/lib/auth/roleRoutes";

const ipDiagnosticSalt = randomBytes(32);
const ipDiagnosticInstance = randomBytes(4).toString("hex");

function ipFingerprint(address: string | null): string | null {
  if (!address) return null;
  return createHmac("sha256", ipDiagnosticSalt)
    .update(address.trim())
    .digest("hex")
    .slice(0, 16);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (
    pathname === "/api/sliders" &&
    request.method === "GET" &&
    process.env.PROXY_IP_DIAGNOSTICS === "true"
  ) {
    const forwardedFor = (request.headers.get("x-forwarded-for") ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean)
      .slice(0, 8)
      .map(ipFingerprint);

    console.info(JSON.stringify({
      event: "frontend_ip_diagnostic",
      instance: ipDiagnosticInstance,
      path: pathname,
      probe: request.nextUrl.searchParams.get("probe") === "segundo" ? "segundo" : null,
      forwardedFor,
      realIp: ipFingerprint(request.headers.get("x-real-ip")),
    }));
  }
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
    "/api/sliders",
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
