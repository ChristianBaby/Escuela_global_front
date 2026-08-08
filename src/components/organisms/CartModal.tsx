"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { cursosService } from "@/lib/services/courses";
import { cn } from "@/lib/utils";

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
  const router = useRouter();
  const { items, addItem, removeItem, hasItem, total } = useCartStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["cart-modal-catalog", debouncedSearch],
    queryFn: () =>
      cursosService.listCatalog({ search: debouncedSearch || undefined, limit: 8 }),
    enabled: open,
    staleTime: 60_000,
  });

  const courses = data?.data ?? [];
  const cartTotal = total();

  function handleAdd(course: (typeof courses)[number]) {
    addItem(course);
    toast.success(`"${course.title}" agregado al carrito`);
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
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Aún no tienes cursos en el carrito. Búscalos abajo y agrégalos.
              </p>
            ) : (
              <ul className="space-y-2 pr-1">
                {items.map(({ course }) => {
                  const symbol = course.currency === "PEN" ? "S/" : "$";
                  const price = course.discount_price ?? course.price;
                  return (
                    <li
                      key={course.id}
                      className="flex items-center gap-2.5 bg-gray-50 rounded-lg p-2"
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
                        <p className="text-xs text-gray-500">{symbol} {price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(course.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        aria-label="Quitar del carrito"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
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
              courses.map((course) => {
                const symbol = course.currency === "PEN" ? "S/" : "$";
                const price = course.discount_price ?? course.price;
                const inCart = hasItem(course.id);
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
                      <p className="text-xs text-gray-500">{symbol} {price.toFixed(2)}</p>
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

        {/* Footer con total y acciones — siempre visible, fuera del área con scroll */}
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {items.length} {items.length === 1 ? "curso" : "cursos"} en el carrito
            </span>
            <span className="font-bold text-gray-900">Total: S/ {cartTotal.toFixed(2)}</span>
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
              disabled={items.length === 0}
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
