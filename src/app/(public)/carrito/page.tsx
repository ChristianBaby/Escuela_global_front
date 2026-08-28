"use client";

import { useState } from "react";
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
  Star,
  Plus,
  Check,
} from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { cartService } from "@/lib/services/cart";
import { cursosService } from "@/lib/services/courses";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { getGuestSessionToken } from "@/lib/session";
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
  const [guestSessionToken] = useState(() => getGuestSessionToken());

  // Espejo local (localStorage) para feedback instantáneo en la UI
  const {
    items: localItems,
    removeItem: removeLocalItem,
    clearCart: clearLocalCart,
    addItem: addLocalItem,
    total: localTotal,
  } = useCartStore();

  // Carrito real en el backend: logueado (cookie) o invitado (session_token)
  const { data: serverCart, isLoading } = useQuery({
    queryKey: [...CART_KEY, isAuthenticated ? "auth" : guestSessionToken],
    queryFn: () => cartService.get(isAuthenticated ? undefined : guestSessionToken),
  });

  // Pool de candidatos para las sugerencias — se pide un lote más grande que lo
  // que se muestra, para que haya de dónde elegir por relevancia (categoría,
  // software compartido, descuento) y no solo los primeros de la lista.
  const { data: catalogData, isLoading: loadingCatalog } = useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => cursosService.list({ limit: 60 }),
    staleTime: 60_000,
  });

  // ── Mutations del carrito real (invitado o logueado) ──
  const serverRemoveMutation = useMutation({
    mutationFn: (itemId: string) => cartService.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast.success("Curso eliminado del carrito");
    },
    onError: () => toast.error("No se pudo eliminar el curso"),
  });

  const serverClearMutation = useMutation({
    mutationFn: () => cartService.clear(isAuthenticated ? undefined : guestSessionToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast.success("Carrito vaciado");
    },
    onError: () => toast.error("No se pudo vaciar el carrito"),
  });

  const serverAddMutation = useMutation({
    mutationFn: (courseId: string) =>
      cartService.add(courseId, isAuthenticated ? undefined : guestSessionToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      toast.success("Curso agregado al carrito");
    },
    onError: () => toast.error("No se pudo agregar el curso"),
  });

  // ── Derived data ──
  const allCourses: Course[] = catalogData?.data ?? [];

  const serverCartAny = serverCart as any;
  let cartItemsRaw: any[] = [];

  // 1. EXTRACTOR DE MATRICES: Intenta leer el formato que devuelva tu NestJS
  if (serverCartAny) {
    if (Array.isArray(serverCartAny)) {
      cartItemsRaw = serverCartAny;
    } else if (serverCartAny.items && Array.isArray(serverCartAny.items)) {
      cartItemsRaw = serverCartAny.items;
    } else if (serverCartAny.data) {
      if (Array.isArray(serverCartAny.data)) {
        cartItemsRaw = serverCartAny.data;
      } else if (serverCartAny.data.items && Array.isArray(serverCartAny.data.items)) {
        cartItemsRaw = serverCartAny.data.items;
      }
    }
  }

  // 2. Mapeo de ítems provenientes del Servidor
  const serverNormalizedItems: DisplayItem[] = cartItemsRaw.map((i: any) => ({
    key: i.cartItemId ?? i.id,
    serverId: i.cartItemId ?? i.id,
    courseId: i.courseId ?? i.course?.id ?? i.course_id,
    title: i.title ?? i.course?.title ?? "Curso de Especialización",
    slug: i.slug ?? i.course?.slug ?? "",
    thumbnail_url: i.thumbnail ?? i.course?.thumbnail_url ?? "",
    price: Number(i.price ?? i.course?.price_pen ?? 0),
    discount_price:
      i.discountPrice ?? i.course?.discount_price_pen
        ? Number(i.discountPrice ?? i.course?.discount_price_pen)
        : undefined,
    currency: i.currency ?? "PEN",
    category_id: i.category_id ?? i.course?.category_id,
    software_tools: i.software_tools ?? i.course?.software_tools ?? [],
  }));

  // 3. Mapeo de ítems provenientes del Almacenamiento Local (Zustand)
  const localNormalizedItems: DisplayItem[] = localItems.map((e) => ({
    key: e.course.id,
    serverId: undefined,
    courseId: e.course.id,
    title: e.course.title,
    slug: e.course.slug,
    thumbnail_url: e.course.thumbnail_url,
    price: e.course.price_pen,
    discount_price: e.course.discount_price_pen,
    currency: "PEN",
    category_id: e.course.category_id,
    software_tools: e.course.software_tools ?? [],
  }));

  // El carrito real (backend) manda siempre que tenga datos; si aún no cargó
  // o quedó vacío por un desfase momentáneo, mostramos el espejo local.
  const displayItems: DisplayItem[] =
    serverNormalizedItems.length > 0 ? serverNormalizedItems : localNormalizedItems;

  const cartCourseIds = new Set(displayItems.map((i) => i.courseId));

  const subtotal =
    serverNormalizedItems.length > 0
      ? (serverCartAny?.subtotal ?? serverCartAny?.data?.subtotal ?? serverNormalizedItems.reduce((acc, item) => acc + (item.discount_price ?? item.price), 0))
      : localTotal();

  const currency = displayItems[0]?.currency ?? "PEN";
  const symbol = currency === "PEN" ? "S/" : "$";

  // Sugerencias: cursos que no están ya en el carrito, ordenados por qué tanto
  // se relacionan con lo que el usuario ya eligió — misma categoría, software
  // en común, o que estén en descuento — en vez de mostrar cualquier curso.
  const cartCategoryIds = new Set(displayItems.map((i) => i.category_id).filter(Boolean));
  const cartSoftwareTools = new Set(displayItems.flatMap((i) => i.software_tools ?? []));

  function relevanceScore(course: Course): number {
    let score = 0;
    if (cartCategoryIds.has(course.category_id)) score += 3;
    const sharedSoftware = course.software_tools?.filter((s) => cartSoftwareTools.has(s)).length ?? 0;
    score += sharedSoftware;
    if (course.discount_price_pen !== undefined && course.discount_price_pen < course.price_pen) score += 1;
    return score;
  }

  const suggestedCourses = allCourses
    .filter((c) => !cartCourseIds.has(c.id))
    .sort((a, b) => relevanceScore(b) - relevanceScore(a));

  function handleRemove(item: DisplayItem) {
    if (item.serverId) {
      serverRemoveMutation.mutate(item.serverId);
    }
    removeLocalItem(item.courseId);
  }

  function handleClear() {
    serverClearMutation.mutate();
    clearLocalCart();
  }

  function handleAddFromCatalog(course: Course) {
    serverAddMutation.mutate(course.id);
    addLocalItem(course);
  }

  function handleCheckout() {
    router.push("/checkout");
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-primary flex items-center gap-2">
              <ShoppingCart size={24} className="text-[#084D95]" />
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
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20 shadow-sm">
              <h2 className="font-semibold text-brand-primary mb-4">Resumen del pedido</h2>

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
                    <span className="text-lg text-[#084D95] tabular-nums">
                      {symbol} {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#084D95] hover:bg-[#084D95]/90 text-white font-medium py-3 rounded-xl shadow-sm transition-colors"
                  >
                    Proceder al pago
                    <ArrowRight size={16} />
                  </button>

                  {!isAuthenticated && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Podrás crear tu cuenta o iniciar sesión al finalizar la compra
                    </p>
                  )}
                </>
              )}

              <Link
                href="/cursos"
                className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-[#084D95] text-gray-700 hover:text-[#084D95] font-medium py-2.5 rounded-xl transition-colors text-sm"
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
            <h2 className="text-lg font-semibold text-brand-primary">
              {displayItems.length === 0 ? "Todos los cursos disponibles" : "También podría interesarte"}
            </h2>
            <Link
              href="/cursos"
              className="text-sm text-[#084D95] hover:underline flex items-center gap-1"
            >
              Ver catálogo completo <ArrowRight size={14} />
            </Link>
          </div>

          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
  category_id?: string;
  software_tools?: string[];
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors shadow-sm">
      <div className="w-20 h-14 rounded-lg bg-[#084D95]/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={20} className="text-[#084D95]/40" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/cursos/${item.slug}`}
          className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#084D95] transition-colors"
        >
          {item.title}
        </Link>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-[#084D95] tabular-nums">
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
  const displayPricePen = course.discount_price_pen ?? course.price_pen;
  const hasDiscount = course.discount_price_pen !== undefined && course.discount_price_pen < course.price_pen;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all flex flex-col">
      <div className="relative h-32 bg-[#084D95]/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={24} className="text-[#084D95]/30" />
        )}
        {course.category && (
          <span className="absolute top-2 left-2 bg-[#23AFE5] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {course.category.name}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link
          href={`/cursos/${course.slug}`}
          className="font-semibold text-gray-900 text-xs leading-snug line-clamp-2 hover:text-[#084D95] transition-colors"
        >
          {course.title}
        </Link>

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            {course.avg_rating?.toFixed(1) || "5.0"}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={10} />
            {formatDuration(course.total_duration_minutes)}
          </span>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div>
            <span className="font-bold text-[#084D95] text-sm tabular-nums">
              S/ {displayPricePen.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="ml-1 text-[10px] text-gray-400 line-through tabular-nums">
                S/ {course.price_pen.toFixed(2)}
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
              className="flex items-center gap-0.5 text-[11px] font-medium text-white bg-[#084D95] hover:bg-[#084D95]/90 px-2 py-1 rounded-lg transition-colors disabled:opacity-60 shrink-0"
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
    <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center shadow-sm px-4">
      <ShoppingCart size={40} className="text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
      <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto mb-5">
        Explora el catálogo y agrega los cursos que te interesen.
      </p>
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