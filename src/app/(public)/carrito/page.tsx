"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  X,
  BookOpen,
  ShoppingBag,
  ArrowRight,
  Clock,
  Users,
  Star,
  Plus,
  Check,
  LogIn,
} from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { cartService, type ApiCartItem } from "@/lib/services/cart";
import { cursosService } from "@/lib/services/courses";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { Course } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────
const CART_KEY = ["cart"];
const COURSES_KEY = ["catalog-for-cart"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number, currency: string) {
  const symbol = currency === "PEN" ? "S/" : "$";
  return `${symbol} ${price.toFixed(2)}`;
}

function formatDuration(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ""}`.trim();
  return `${minutes}m`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CarritoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Guest cart (localStorage)
  const {
    items: localItems,
    removeItem: removeLocalItem,
    clearCart: clearLocalCart,
    addItem: addLocalItem,
    hasItem: hasLocalItem,
    total: localTotal,
  } = useCartStore();

  // Server cart (only when authenticated)
  const { data: serverCart, isLoading: loadingServerCart } = useQuery({
    queryKey: CART_KEY,
    queryFn: () => cartService.get(),
    enabled: isAuthenticated,
  });

  // Available catalog courses
  const { data: catalogData, isLoading: loadingCatalog } = useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => cursosService.list({ limit: 12 }),
    staleTime: 60_000,
  });

  // ── Mutations for server cart (authenticated) ──
  const serverRemoveMutation = useMutation({
    mutationFn: (itemId: string) => cartService.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast.success("Curso eliminado del carrito");
    },
    onError: () => toast.error("No se pudo eliminar el curso"),
  });

  const serverClearMutation = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast.success("Carrito vaciado");
    },
    onError: () => toast.error("No se pudo vaciar el carrito"),
  });

  const serverAddMutation = useMutation({
    mutationFn: (courseId: string) => cartService.add(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast.success("Curso agregado al carrito");
    },
    onError: () => toast.error("No se pudo agregar el curso"),
  });

  // ── Derived data ──
  const isLoading = isAuthenticated ? loadingServerCart : false;
  const allCourses: Course[] = catalogData?.data ?? [];

  // Normalize cart items for display
  const displayItems: DisplayItem[] = isAuthenticated
    ? (serverCart?.items ?? []).map((i) => ({
        key: i.id,
        serverId: i.id,
        courseId: i.course.id,
        title: i.course.title,
        slug: i.course.slug,
        thumbnail_url: i.course.thumbnail_url,
        price: i.course.price,
        discount_price: i.course.discount_price,
        currency: i.course.currency,
      }))
    : localItems.map((e) => ({
        key: e.course.id,
        serverId: undefined,
        courseId: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        thumbnail_url: e.course.thumbnail_url,
        price: e.course.price,
        discount_price: e.course.discount_price,
        currency: e.course.currency,
      }));

  const cartCourseIds = new Set(displayItems.map((i) => i.courseId));

  const subtotal = isAuthenticated
    ? (serverCart?.subtotal ?? 0)
    : localTotal();

  const currency = displayItems[0]?.currency ?? "USD";
  const symbol = currency === "PEN" ? "S/" : "$";

  // Courses NOT already in cart
  const suggestedCourses = allCourses.filter((c) => !cartCourseIds.has(c.id));

  function handleRemove(item: DisplayItem) {
    if (isAuthenticated && item.serverId) {
      serverRemoveMutation.mutate(item.serverId);
    } else {
      removeLocalItem(item.courseId);
      toast.success("Curso eliminado del carrito");
    }
  }

  function handleClear() {
    if (isAuthenticated) {
      serverClearMutation.mutate();
      clearLocalCart();
    } else {
      clearLocalCart();
      toast.success("Carrito vaciado");
    }
  }

  function handleAddFromCatalog(course: Course) {
    if (isAuthenticated) {
      serverAddMutation.mutate(course.id);
      addLocalItem(course);
    } else {
      addLocalItem(course);
      toast.success("Curso agregado al carrito");
    }
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={24} className="text-[#2B55A3]" />
              Carrito de compras
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {isLoading
                ? "Cargando…"
                : displayItems.length === 0
                ? "Tu carrito está vacío"
                : `${displayItems.length} ${displayItems.length === 1 ? "curso" : "cursos"} en tu carrito`}
            </p>
          </div>
          {displayItems.length > 0 && (
            <button
              onClick={handleClear}
              disabled={serverClearMutation.isPending}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              Vaciar carrito
            </button>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Items (2/3) ── */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              <CartSkeleton />
            ) : displayItems.length === 0 ? (
              <EmptyCart />
            ) : (
              displayItems.map((item) => (
                <CartItemRow
                  key={item.key}
                  item={item}
                  onRemove={() => handleRemove(item)}
                  removing={
                    serverRemoveMutation.isPending &&
                    serverRemoveMutation.variables === item.serverId
                  }
                />
              ))
            )}
          </div>

          {/* ── Summary (1/3) ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Resumen del pedido</h2>

              {displayItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Agrega cursos para continuar</p>
              ) : (
                <>
                  <div className="space-y-3 text-sm">
                    {displayItems.map((item) => {
                      const price = item.discount_price ?? item.price;
                      return (
                        <div key={item.key} className="flex justify-between text-gray-600">
                          <span className="line-clamp-1 flex-1 pr-2">{item.title}</span>
                          <span className="shrink-0 tabular-nums font-medium">
                            {formatPrice(price, item.currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span className="text-[#2B55A3] text-lg tabular-nums">
                      {symbol} {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#2B55A3] hover:bg-[#2B55A3]/90 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    {!isAuthenticated && <LogIn size={16} />}
                    Proceder al pago
                    {isAuthenticated && <ArrowRight size={16} />}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Se te pedirá iniciar sesión para completar el pago
                    </p>
                  )}
                </>
              )}

              <Link
                href="/cursos"
                className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-[#2B55A3] text-gray-700 hover:text-[#2B55A3] font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                <ShoppingBag size={15} />
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>

        {/* ── Catalog section ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {displayItems.length === 0 ? "Todos los cursos disponibles" : "También podría interesarte"}
            </h2>
            <Link
              href="/cursos"
              className="text-sm text-[#2B55A3] hover:underline flex items-center gap-1"
            >
              Ver catálogo completo <ArrowRight size={14} />
            </Link>
          </div>

          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CourseCatalogSkeleton key={i} />
              ))}
            </div>
          ) : suggestedCourses.length === 0 && allCourses.length > 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-10 text-center">
              <Check size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Ya tienes todos los cursos disponibles en tu carrito</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(displayItems.length === 0 ? allCourses : suggestedCourses).map((course) => (
                <CatalogCourseCard
                  key={course.id}
                  course={course}
                  inCart={cartCourseIds.has(course.id)}
                  onAdd={() => handleAddFromCatalog(course)}
                  adding={
                    serverAddMutation.isPending && serverAddMutation.variables === course.id
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DisplayItem {
  key: string;
  serverId?: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail_url: string;
  price: number;
  discount_price?: number;
  currency: string;
}

// ─── Cart Item Row ─────────────────────────────────────────────────────────────
function CartItemRow({
  item,
  onRemove,
  removing,
}: {
  item: DisplayItem;
  onRemove: () => void;
  removing: boolean;
}) {
  const hasDiscount = item.discount_price !== undefined && item.discount_price < item.price;
  const displayPrice = item.discount_price ?? item.price;
  const symbol = item.currency === "PEN" ? "S/" : "$";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
      <div className="w-20 h-14 rounded-lg bg-[#2B55A3]/10 flex-shrink-0 overflow-hidden">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={20} className="text-[#2B55A3]/40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/cursos/${item.slug}`}
          className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#2B55A3] transition-colors"
        >
          {item.title}
        </Link>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-[#2B55A3] tabular-nums">
          {symbol} {displayPrice.toFixed(2)}
        </p>
        {hasDiscount && (
          <p className="text-xs text-gray-400 line-through tabular-nums">
            {symbol} {item.price.toFixed(2)}
          </p>
        )}
      </div>

      <button
        onClick={onRemove}
        disabled={removing}
        title="Eliminar del carrito"
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Catalog Course Card ───────────────────────────────────────────────────────
function CatalogCourseCard({
  course,
  inCart,
  onAdd,
  adding,
}: {
  course: Course;
  inCart: boolean;
  onAdd: () => void;
  adding: boolean;
}) {
  const displayPrice = course.discount_price ?? course.price;
  const hasDiscount = course.discount_price !== undefined && course.discount_price < course.price;
  const symbol = course.currency === "PEN" ? "S/" : "$";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all flex flex-col">
      <div className="relative h-32 bg-[#2B55A3]/10 flex-shrink-0 overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={24} className="text-[#2B55A3]/30" />
          </div>
        )}
        {course.category && (
          <span className="absolute top-2 left-2 bg-[#3FB1E5] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {course.category.name}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link
          href={`/cursos/${course.slug}`}
          className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2 hover:text-[#2B55A3] transition-colors"
        >
          {course.title}
        </Link>

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            {course.avg_rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={10} />
            {formatDuration(course.total_duration_minutes)}
          </span>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div>
            <span className="font-bold text-[#2B55A3] text-sm tabular-nums">
              {symbol} {displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="ml-1 text-[10px] text-gray-400 line-through tabular-nums">
                {symbol} {course.price.toFixed(2)}
              </span>
            )}
          </div>

          {inCart ? (
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shrink-0">
              <Check size={11} />
              En carrito
            </span>
          ) : (
            <button
              onClick={onAdd}
              disabled={adding}
              className="flex items-center gap-0.5 text-[11px] font-medium text-white bg-[#2B55A3] hover:bg-[#2B55A3]/90 px-2 py-1 rounded-lg transition-colors disabled:opacity-60 shrink-0"
            >
              <Plus size={11} />
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty Cart ────────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
      <ShoppingCart size={40} className="text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
      <p className="text-gray-400 text-sm mt-1">Agrega cursos desde el catálogo de abajo.</p>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function CartSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 animate-pulse">
          <div className="w-20 h-14 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="w-16 h-5 bg-gray-200 rounded" />
          <div className="w-7 h-7 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function CourseCatalogSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-14" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
