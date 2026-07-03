"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, Badge, buttonVariants } from "@/components/atoms";
import { CartModal } from "@/components/organisms/CartModal";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { authService } from "@/lib/services/auth";
import { ShoppingCart, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Cursos", href: "/cursos" },
  { label: "Nosotros", href: "/#nosotros" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { isAuthenticated, user, clearUser } = useAuthStore();
  const localItems = useCartStore((s) => s.items);
  const router = useRouter();

  // cartCount uses local store for both guests and authenticated users
  // (local store is always in sync since add/remove actions update it)
  const cartCount = localItems.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // continuar aunque falle la llamada API
    }
    clearUser();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/auth/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white transition-shadow",
        scrolled && "shadow-sm border-b border-gray-100"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <Logo variant="full" size="sm" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cart icon — visible for all users, opens quick-add popup */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-1.5 text-gray-600 hover:text-brand-primary transition-colors"
              aria-label="Abrir carrito de compras"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-secondary text-white border-0">
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
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-bold select-none">
                    {user?.first_name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <span className="max-w-[90px] truncate">{user?.first_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-gray-700 hover:text-brand-primary h-8 text-xs px-3")}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className={cn(buttonVariants({ size: "sm" }), "bg-brand-primary hover:bg-brand-primary/90 text-white h-8 text-xs px-3")}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-gray-600 hover:text-brand-primary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setCartOpen(true);
              }}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Carrito
              </span>
              {cartCount > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[11px] bg-brand-secondary text-white border-0">
                  {cartCount}
                </Badge>
              )}
            </button>
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block py-2.5 px-3 text-sm font-medium text-gray-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Mi cuenta
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left py-2.5 px-3 text-sm font-medium text-red-500"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white")}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className={cn(buttonVariants(), "w-full bg-brand-primary hover:bg-brand-primary/90 text-white")}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CartModal open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
