"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShoppingCart, Trash2, PlusCircle, CheckCircle2, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/atoms";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { cursosService } from "@/lib/services/courses";
import { cartService } from "@/lib/services/cart";
import { studentService } from "@/lib/services/student";
import { getGuestSessionToken } from "@/lib/session";
import { extractCartItems } from "@/lib/cart-sync";
import { isEnrollmentActive } from "@/lib/enrollment";
import { cn } from "@/lib/utils";

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DisplayCartItem {
  courseId: string;
  serverId?: string;
  title: string;
  thumbnail_url?: string;
  price: number;
}

// 🚀 Formateador blindado contra undefined, null o strings
function formatPrice(val: unknown): string {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items: localItems, addItem, removeItem: removeLocalItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [guestSessionToken] = useState(() => getGuestSessionToken());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Carrito real (invitado o logueado) — la misma queryKey que usan el Header,
  // /carrito y /checkout, así que comparten caché y se mantienen sincronizados.
  const { data: serverCart } = useQuery({
    queryKey: ["cart", isAuthenticated ? "auth" : guestSessionToken],
    queryFn: () => cartService.get(isAuthenticated ? undefined : guestSessionToken),
  });

  // Se pide un lote más grande que los 8 que se muestran — si se filtraran
  // los cursos ya matriculados DESPUÉS de traer solo 8, y esos 8 primeros
  // resultan ser justo los que el alumno ya tiene, la lista se quedaba vacía
  // ("No se encontraron cursos") aunque sí había más cursos disponibles.
  const { data, isLoading } = useQuery({
    queryKey: ["cart-modal-catalog", debouncedSearch],
    queryFn: () =>
      cursosService.listCatalog({ search: debouncedSearch || undefined, limit: 30 }),
    enabled: open,
    staleTime: 60_000,
  });

  // Misma queryKey que /cursos, /dashboard y /mis-cursos — para no sugerir
  // (ni dejar re-agregar) un curso que el alumno ya tiene, igual que
  // Udemy/Coursera. Si el acceso ya venció, vuelve a contar como sugerible.
  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["mis-inscripciones"],
    queryFn: studentService.getMyEnrollments,
    enabled: open && isAuthenticated,
  });
  const enrolledCourseIds = new Set(
    myEnrollments.filter(isEnrollmentActive).map((e) => e.course_id)
  );

  const courses = (data?.data ?? []).filter((c) => !enrolledCourseIds.has(c.id)).slice(0, 8);

  // El backend no deduplica /cart/add por curso, así que un mismo curso puede
  // haber quedado con más de una fila — nos quedamos con la primera por curso.
  const serverItemsRaw = extractCartItems(serverCart);
  const serverDisplayItems: DisplayCartItem[] = Array.from(
    new Map(
      serverItemsRaw.map((i) => [
        i.courseId,
        {
          courseId: i.courseId,
          serverId: i.cartItemId,
          title: i.title,
          thumbnail_url: i.thumbnail,
          price: Number(i.finalPrice ?? i.discountPrice ?? i.price ?? 0),
        },
      ])
    ).values()
  );

  const localDisplayItems: DisplayCartItem[] = localItems.map(({ course }) => ({
    courseId: course.id,
    title: course.title,
    thumbnail_url: course.thumbnail_url,
    price: Number(course.discount_price_pen ?? course.price_pen ?? 0),
  }));

  // Logueado: el carrito del servidor es SIEMPRE la fuente de verdad, aunque
  // venga en 0 — nunca se cae al espejo local (que puede estar desactualizado
  // o vacío, p. ej. tras cerrar sesión). Invitado: el carrito real vive
  // bloqueado en el backend, así que ahí sí el espejo local es la única
  // fuente posible.
  const displayItems = isAuthenticated
    ? serverDisplayItems
    : (serverDisplayItems.length > 0 ? serverDisplayItems : localDisplayItems);
  const cartCourseIds = new Set(displayItems.map((i) => i.courseId));
  const cartTotal = displayItems.reduce((sum, i) => sum + i.price, 0);

  const removeMutation = useMutation({
    mutationFn: (item: DisplayCartItem) =>
      item.serverId
        ? cartService.remove(item.serverId)
        : Promise.resolve({ success: true, item_count: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Curso eliminado del carrito");
    },
    onError: () => toast.error("No se pudo quitar el curso del carrito"),
  });

  function handleRemove(item: DisplayCartItem) {
    removeLocalItem(item.courseId);
    removeMutation.mutate(item);
  }

  async function handleAdd(course: (typeof courses)[number]) {
    // El espejo local es solo para feedback instantáneo — el curso ya no se
    // puede duplicar desde esta lista (el botón se deshabilita en cuanto
    // está en el carrito real), así que un error acá es real y sí vale la
    // pena mostrarlo en vez de quedarse callado.
    addItem(course);
    try {
      await cartService.add(course.id, isAuthenticated ? undefined : guestSessionToken);
      toast.success(`"${course.title}" agregado al carrito`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo agregar el curso");
    }
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  function goToCart() {
    onOpenChange(false);
    router.push("/carrito");
  }

  function goToCheckout() {
    onOpenChange(false);
    router.push("/checkout");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-primary" />
            Mi carrito
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {/* Items actuales del carrito */}
          <div className="px-4 pt-3">
            {displayItems.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Aún no tienes cursos en el carrito. Búscalos abajo y agrégalos.
              </p>
            ) : (
              <ul className="space-y-2 pr-1">
                {displayItems.map((item) => (
                  <li
                    key={item.courseId}
                    className="flex items-center gap-2.5 bg-gray-50 rounded-lg p-2"
                  >
                    <div className="w-10 h-10 rounded-md bg-brand-primary/10 overflow-hidden shrink-0">
                      {item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">S/ {formatPrice(item.price)}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(item)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Quitar del carrito"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Buscador de cursos para agregar */}
          <div className="px-4 pt-4 pb-2 border-t border-gray-100 mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Agregar cursos
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cursos por nombre..."
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="px-4 pb-2 space-y-2">
            {isLoading ? (
              <p className="text-sm text-gray-400 py-4 text-center">Buscando cursos...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No se encontraron cursos{debouncedSearch ? ` para "${debouncedSearch}"` : ""}.
              </p>
            ) : (
              courses.map((course: any) => {
                const rawPrice =
                  course?.discount_price_pen ??
                  course?.discount_price ??
                  course?.price_pen ??
                  course?.price ??
                  0;
                const inCart = cartCourseIds.has(course.id);
                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-2.5 border border-gray-100 rounded-lg p-2 hover:border-brand-primary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-brand-primary/10 overflow-hidden shrink-0">
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500">S/ {formatPrice(rawPrice)}</p>
                    </div>
                    <button
                      onClick={() => !inCart && handleAdd(course)}
                      disabled={inCart}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0 transition-colors",
                        inCart
                          ? "bg-green-50 text-green-700 cursor-default"
                          : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white"
                      )}
                    >
                      {inCart ? (
                        <>
                          <CheckCircle2 size={13} /> Agregado
                        </>
                      ) : (
                        <>
                          <PlusCircle size={13} /> Agregar
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer del modal */}
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {displayItems.length} {displayItems.length === 1 ? "curso" : "cursos"} en el carrito
            </span>
            <span className="font-bold text-gray-900">Total: S/ {formatPrice(cartTotal)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToCart}
              className="flex-1 border-2 border-brand-primary text-brand-primary font-semibold py-2 rounded-lg text-sm hover:bg-brand-primary/5 transition-colors"
            >
              Ver carrito completo
            </button>
            <button
              onClick={goToCheckout}
              disabled={displayItems.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-primary text-white font-semibold py-2 rounded-lg text-sm hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CreditCard size={15} />
              Pagar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
