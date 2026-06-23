"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/auth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tag,
  ClipboardList,
  FileText,
  Megaphone,
  Images,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronRight,
  User,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/panel",
        icon: <LayoutDashboard size={18} />,
        roles: ["admin"],
      },
      {
        label: "Estudiantes",
        href: "/panel/estudiantes",
        icon: <Users size={18} />,
        roles: ["admin", "soporte"],
      },
    ],
  },
  {
    title: "Contenido",
    items: [
      {
        label: "Cursos",
        href: "/panel/soporte/cursos",
        icon: <BookOpen size={18} />,
        roles: ["admin", "soporte"],
      },
      {
        label: "Categorías",
        href: "/panel/soporte/categorias",
        icon: <Tag size={18} />,
        roles: ["admin", "soporte"],
      },
      {
        label: "Matriculas",
        href: "/panel/soporte/matriculas",
        icon: <ClipboardList size={18} />,
        roles: ["admin", "soporte"],
      },
      {
        label: "Plantillas",
        href: "/panel/soporte/certificados/plantillas",
        icon: <FileText size={18} />,
        roles: ["admin", "soporte"],
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        label: "Resumen",
        href: "/panel/marketing",
        icon: <TrendingUp size={18} />,
        roles: ["admin", "marketing"],
      },
      {
        label: "Publicaciones",
        href: "/panel/marketing/publicaciones",
        icon: <Megaphone size={18} />,
        roles: ["admin", "marketing"],
      },
      {
        label: "Sliders",
        href: "/panel/marketing/sliders",
        icon: <Images size={18} />,
        roles: ["admin", "marketing"],
      },
      {
        label: "Notificaciones",
        href: "/panel/marketing/notificaciones",
        icon: <Bell size={18} />,
        roles: ["admin", "marketing"],
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        label: "Mi perfil",
        href: "/panel/perfil",
        icon: <User size={18} />,
        roles: ["admin", "soporte", "marketing"],
      },
      {
        label: "Auditoría",
        href: "/panel/auditoria",
        icon: <ShieldCheck size={18} />,
        roles: ["admin"],
      },
    ],
  },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, clearUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed with local logout even if API call fails
    }
    clearUser();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/auth/login";
  };


  const isActive = (href: string) => {
    if (href === "/panel") return pathname === "/panel";
    return pathname.startsWith(href);
  };

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
        <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-200">
          <Link href="/panel" className="flex items-center gap-2 flex-1 min-w-0">
            <Image
              src="/Logo_escuela_global.png"
              alt="Escuela Global"
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
            <span className="text-xs bg-[#2B55A3] text-white px-2 py-0.5 rounded-full capitalize shrink-0">
              {user?.role}
            </span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(
              (item) => user?.role && item.roles.includes(user.role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={si} className="mb-4">
                {section.title && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(item.href)
                            ? "bg-[#2B55A3] text-white font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {isActive(item.href) && <ChevronRight size={14} />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#2B55A3] flex items-center justify-center text-white text-sm font-semibold">
              {user?.first_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header móvil */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <Link href="/panel">
            <Image
              src="/Logo_escuela_global.png"
              alt="Escuela Global"
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
            />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
