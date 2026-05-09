"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tag,
  ClipboardList,
  FileText,
  Megaphone,
  Images,
  ShieldCheck,
  LogOut,
  ChevronRight,
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
        roles: ["admin"],
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
        label: "Matriculaciones",
        href: "/panel/soporte/matriculaciones",
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
    ],
  },
  {
    title: "Sistema",
    items: [
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
  const router = useRouter();
  const { user, clearUser } = useAuthStore();

  const handleLogout = () => {
    clearUser();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/panel") return pathname === "/panel";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-lg font-bold text-[#2B55A3]">Escuela Global</span>
          <span className="ml-2 text-xs bg-[#2B55A3] text-white px-2 py-0.5 rounded-full capitalize">
            {user?.role}
          </span>
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
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
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
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
