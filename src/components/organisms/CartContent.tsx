"use client";

import Link from "next/link";
import { Trash2, ArrowLeft, CreditCard, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/lib/services/cart/cart";
import { useAuthStore } from "@/store/authStore";

export function CartContent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAuthenticated = !!user;

  // 1. Consulta reactiva del carrito
  const { data: cartData, isLoading, isError } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: () => cartService.getCart(isAuthenticated),
  });

  // 2. Mutación para eliminar un ítem
  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Curso eliminado del carrito");
    },
    onError: () => toast.error("No se pudo eliminar el curso"),
  });

  // 3. Mutación para vaciar todo el carrito
  const clearMutation = useMutation({
    mutationFn: () => cartService.clearCart(isAuthenticated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Se ha vaciado el carrito de compras");
    },
    onError: () => toast.error("Error al vaciar el carrito"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={36} className="animate-spin text-[#2B55A3]" />
        <p className="text-sm text-gray-500">Cargando tu carrito de compras...</p>
      </div>
    );
  }

  if (isError || !cartData || cartData.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2B55A3] flex items-center justify-center mb-4">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Tu carrito está vacío</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Aún no has agregado ningún curso a tu carrito. ¡Explora nuestro catálogo para empezar a aprender!
        </p>
        <Link 
          href="/cursos" 
          className="mt-6 px-6 py-2.5 bg-[#2B55A3] text-white rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Ver catálogo de cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carrito de Compras</h1>
        <p className="text-sm text-gray-500">Revisa los cursos seleccionados antes de proceder al pago seguro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Tabla de Cursos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Curso</th>
                    <th className="px-6 py-3.5 text-right">Precio</th>
                    <th className="px-4 py-3.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cartData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4 min-w-[300px]">
                        <div className="w-16 h-10 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shrink-0 relative">
                          <img 
                            src={item.course.thumbnail_url || "/uploads/courses/default-thumb.png"} 
                            alt={item.course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                            {item.course.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {item.course.currency === "PEN" ? "S/" : "$"} {(item.course.discount_price ?? item.course.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <Link
              href="/cursos"
              className="text-sm font-medium text-gray-600 hover:text-[#2B55A3] inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} />
              Continuar comprando
            </Link>
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* Resumen del Pedido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Resumen del pedido</h2>
          
          <div className="divide-y divide-gray-100 text-sm">
            <div className="flex justify-between py-2 text-gray-500">
              <span>Cursos agregados</span>
              <span className="font-medium text-gray-900">{cartData.item_count}</span>
            </div>
            <div className="flex justify-between py-3 text-base font-bold text-gray-900 pt-3">
              <span>Total a pagar</span>
              <span className="text-lg text-[#2B55A3]">
                S/ {cartData.subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={isAuthenticated ? "/checkout" : "/auth/login?redirect=/carrito"}
              className="w-full py-3 bg-[#2B55A3] text-white rounded-lg text-sm font-semibold hover:bg-[#2B55A3]/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <CreditCard size={16} />
              {isAuthenticated ? "Proceder al pago" : "Inicia sesión para pagar"}
            </Link>
          </div>
          
          <p className="text-[11px] text-center text-gray-400 mt-2">
            Pagos seguros con cifrado SSL. Procesado de manera internacional o local (Niubiz/PayPal).
          </p>
        </div>
      </div>
    </div>
  );
}