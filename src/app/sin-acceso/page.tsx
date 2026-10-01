"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getLandingForRole } from "@/lib/auth/roleRoutes";

export default function SinAccesoPage() {
  const { user } = useAuthStore();
  const homeHref = user ? getLandingForRole(user.role) : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl font-bold text-[#084D95] mb-4">403</p>
        <h1 className="text-xl font-semibold text-brand-primary mb-2">Sin acceso</h1>
        <p className="text-gray-500 mb-6">No tienes permisos para ver esta página.</p>
        <Link href={homeHref} className="text-sm text-[#084D95] hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
