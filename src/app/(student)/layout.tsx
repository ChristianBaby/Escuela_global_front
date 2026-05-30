"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/auth";
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  User,
  ShoppingCart,
  LogOut,
  Award,
} from "lucide-react";

const NAV = [
  { label: "Inicio",            href: "/dashboard",          icon: LayoutDashboard },
  { label: "Mis cursos",        href: "/mis-cursos",         icon: BookOpen },
  { label: "Mis certificados",  href: "/mis-certificados",   icon: Award },
  { label: "Carrito",           href: "/carrito",             icon: ShoppingCart },
  { label: "Notificaciones",    href: "/notificaciones",      icon: Bell },
  { label: "Mi perfil",         href: "/perfil",              icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { user, clearUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed with local logout even if API call fails
    }
    clearUser();
<<<<<<< HEAD
    router.push("/");
=======
=======
>>>>>>> 035da4cf21cb4db4b7f1bf9b68cbb3bb9f04cf30
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/auth/login";
  };

  const initials = user?.first_name
    ? (user.first_name[0] + (user.last_name?.[0] ?? "")).toUpperCase() || "?"
    : "?";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center">
          <Link href="/dashboard">
            <Image
              src="/Logo_escuela_global.png"
              alt="Escuela Global"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#2B55A3] text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Usuario + logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#2B55A3] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user ? `${user.first_name} ${user.last_name}` : "Estudiante"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 ml-64">
        {/* Header top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm text-gray-500">
            Bienvenido de vuelta, <span className="font-medium text-gray-900">{user?.first_name ?? "Estudiante"}</span>
          </div>
          <Link href="/cursos" className="text-sm font-medium text-[#2B55A3] hover:text-[#3FB1E5] transition-colors">
            Explorar cursos →
          </Link>
        </header>

        {/* Página */}
        <div className="px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
