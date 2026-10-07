"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/auth";
import { useQuery } from "@tanstack/react-query";
import { notificacionesService } from "@/lib/services/notifications";
import { CartModal } from "@/components/organisms/CartModal";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  User,
  ShoppingCart,
  LogOut,
  Award,
  GraduationCap,
  Menu,
  X,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

const NAV = [
  { label: "Inicio",           href: "/dashboard",        icon: LayoutDashboard },
  { label: "Mis cursos",       href: "/mis-cursos",       icon: BookOpen },
  { label: "Mis certificados", href: "/mis-certificados", icon: Award },
  { label: "Docentes",         href: "/docentes",         icon: GraduationCap },
  { label: "Carrito",          href: "/carrito",          icon: ShoppingCart },
  { label: "Notificaciones",   href: "/notificaciones",   icon: Bell },
  { label: "Mi perfil",        href: "/perfil",           icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Consulta el conteo de notificaciones no leídas cada 60 segundos
  const { data: notifData } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: notificacionesService.list,
    refetchInterval: 60_000,
    staleTime: 0,
  });
  const unreadCount = notifData?.unread_count ?? 0;
  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;
  const badgeColor = unreadCount >= 10 ? "bg-red-600" : "bg-[#084D95]";

  // 🚀 Mostrar PopUp para cambiar contraseña si el usuario aún no lo ha cerrado/cambiado
  useEffect(() => {
    if (!user?.id) return;
    const dismissed = localStorage.getItem(`pwd_prompt_dismissed_${user.id}`);
    if (!dismissed) {
      // Pequeño retardo para dar una transición suave al cargar la vista
      const timer = setTimeout(() => setShowPasswordPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const handleDismissPrompt = (dontRemind = true) => {
    if (user?.id && dontRemind) {
      localStorage.setItem(`pwd_prompt_dismissed_${user.id}`, "true");
    }
    setShowPasswordPrompt(false);
  };

  const handleGoToChangePassword = () => {
    handleDismissPrompt(true);
    router.push("/perfil?tab=security");
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed with local logout even if API call fails
    }
    clearUser();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/auth/login";
  };

  const initials = user?.first_name
    ? (user.first_name[0] + (user.last_name?.[0] ?? "")).toUpperCase() || "?"
    : "?";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Link href="/" className="flex-1 min-w-0">
            <Image
              src="/logo_full_escuela_global.svg"
              alt="Escuela Global"
              width={164}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            const isNotif = href === "/notificaciones";
            const isCart = href === "/carrito";

            const itemClassName = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
              active
                ? "bg-[#084D95] text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`;

            const content = (
              <>
                <span className="relative shrink-0">
                  <Icon size={18} />
                  {isNotif && badgeLabel && (
                    <span className={`absolute -top-2 -right-2 min-w-[16px] h-4 px-0.5 rounded-full ${badgeColor} text-white text-[10px] font-bold flex items-center justify-center leading-none`}>
                      {badgeLabel}
                    </span>
                  )}
                </span>
                {label}
              </>
            );

            if (isCart) {
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    setCartOpen(true);
                  }}
                  className={itemClassName}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={itemClassName}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Usuario + logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#084D95] flex items-center justify-center text-white text-xs font-bold shrink-0">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden text-gray-600 hover:text-gray-800 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="text-sm text-gray-500 truncate">
              Bienvenido de vuelta, <span className="font-medium text-gray-900">{user?.first_name ?? "Estudiante"}</span>
            </div>
          </div>
          <Link
            href="/cursos"
            className="btn-shine flex items-center gap-1.5 text-sm font-medium text-white bg-[#084D95] hover:bg-[#084D95]/90 transition-colors shrink-0 px-4 py-2 rounded-lg"
          >
            Explorar cursos →
          </Link>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <CartModal open={cartOpen} onOpenChange={setCartOpen} />

      {/* 🚀 MODAL POPUP: RECORDATORIO DE CAMBIO DE CONTRASEÑA */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-gray-100">
            <button
              onClick={() => handleDismissPrompt(true)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#084D95] flex items-center justify-center mb-4">
              <ShieldCheck size={28} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¡Protege tu cuenta!
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Por motivos de seguridad, te sugerimos actualizar tu contraseña por una personalizada y fácil de recordar para ti. Puedes hacerlo en cualquier momento desde tu perfil.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => handleDismissPrompt(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Recordar más tarde
              </button>
              <button
                type="button"
                onClick={handleGoToChangePassword}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#084D95] hover:bg-[#084D95]/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <KeyRound size={15} />
                Cambiar contraseña ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}