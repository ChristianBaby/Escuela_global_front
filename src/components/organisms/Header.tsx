"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo, Badge, buttonVariants } from "@/components/atoms";
import { CartModal } from "@/components/organisms/CartModal";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { authService } from "@/lib/services/auth";
import { ShoppingCart, Menu, X, LogOut } from "lucide-react"; // 🟢 Solo íconos del sistema
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════
// ÍCONOS DE REDES SOCIALES (SVG Nativos - Sin dependencias externas)
// ══════════════════════════════════════════════════════════════════════

function YoutubeIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.79 4.49 6.27 6.27 0 0 0 1.89-4.49V8.55a8.27 8.27 0 0 0 4.84 1.56V6.69z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: HEADER
// ══════════════════════════════════════════════════════════════════════

const NAV_LINKS = [
  { label: "Cursos", href: "/cursos" },
  { label: "Nosotros", href: "/institucional/nosotros" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { isAuthenticated, user, clearUser } = useAuthStore();
  const localItems = useCartStore((s) => s.items);
  const router = useRouter();
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === "/cursos") return pathname.startsWith("/cursos");
    if (href.startsWith("/institucional")) return pathname.startsWith("/institucional");
    return pathname === href;
  };
  const isCartActive = pathname === "/carrito";
  const cartCount = localItems.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearUser();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white transition-shadow">
      {/* Barra superior de Redes Sociales */}
      <div className="bg-[#0B1230] text-gray-300 text-xs py-1.5 border-b border-white/10 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <span className="text-[11px] text-gray-400">
            Grupo Empresarial Especializaciones Global LLC
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 font-medium">Síguenos:</span>
            <div className="flex items-center gap-3.5">
              <a
                href="https://www.youtube.com/@especializacionesescuelaglobal"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#3FB1E5] transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.tiktok.com/@escuelaglobal07?_r=1&_t=ZS-97GymbiMWXa"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#3FB1E5] transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.instagram.com/escuelaglobaloficial/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#3FB1E5] transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.facebook.com/escuelaglobaloficial.net"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#3FB1E5] transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Barra principal de navegación */}
      <div className={cn("transition-shadow", scrolled && "shadow-sm border-b border-gray-100")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Logo variant="full" size="sm" />

            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isNavActive(link.href)
                      ? "text-brand-primary font-semibold"
                      : "text-gray-600 hover:text-brand-primary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className={cn(
                  "relative p-2 transition-colors rounded-lg hover:bg-gray-50",
                  isCartActive ? "text-brand-primary" : "text-gray-600 hover:text-brand-primary"
                )}
                aria-label="Abrir carrito de compras"
              >
                <ShoppingCart size={19} />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-brand-secondary text-white border-0">
                    {cartCount}
                  </Badge>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-primary transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-bold select-none">
                      {user?.first_name?.charAt(0).toUpperCase() ?? "U"}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.first_name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-gray-700 hover:text-brand-primary text-xs px-3 h-8")}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className={cn(buttonVariants({ size: "sm" }), "bg-brand-primary hover:bg-brand-primary/90 text-white text-xs px-3 h-8")}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>

            {/* Botón Mobile */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-brand-primary transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                isNavActive(link.href)
                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Redes en móvil */}
          <div className="pt-2 pb-1 border-t border-gray-100 flex items-center justify-between px-3">
            <span className="text-xs text-gray-500 font-medium">Síguenos:</span>
            <div className="flex items-center gap-4 text-gray-600">
              <a href="https://youtube.com/@especializacionesglobal" target="_blank" rel="noopener noreferrer">
                <YoutubeIcon className="w-4 h-4" />
              </a>
              <a href="https://tiktok.com/@especializacionesglobal" target="_blank" rel="noopener noreferrer">
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/especializacionesglobal" target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a href="https://facebook.com/especializacionesglobal" target="_blank" rel="noopener noreferrer">
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="block py-2 px-3 text-sm font-medium text-gray-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Mi aula virtual
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left py-2 px-3 text-sm font-medium text-red-500"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full text-xs")}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className={cn(buttonVariants(), "w-full bg-brand-primary text-white text-xs")}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <CartModal open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}