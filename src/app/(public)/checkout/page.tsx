"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PublicLayout } from "@/components/templates";
import { MercadoPagoBrick } from "@/components/organisms/MercadoPagoBrick";
import { cartService } from "@/lib/services/cart";
import { CreditCard, Wallet, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuthStore();
  
  // 1. Traemos ambos estados (Servidor y Local) igual que en el carrito
  const { data: serverCart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.get(),
    enabled: isAuthenticated,
  });
  
  const { items: localItems, total: localTotal } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "mercado_pago">("mercado_pago");

  // 2. NORMALIZACIÓN COMPLETA: Sincronizamos los datos para la Demo
  // Si hay datos en el servidor los usa, si no, recurre al local (donde vive el curso inyectado)
  const displayItems = isAuthenticated && serverCart?.items && serverCart.items.length > 0
    ? serverCart.items.map((i: any) => ({
        id: i.course.id,
        title: i.course.title,
        price: Number(i.course.discount_price ?? i.course.price),
      }))
    : localItems.map((e: any) => ({
        id: e.course.id,
        title: e.course.title,
        price: Number(e.course.discount_price ?? e.course.price),
      }));

  const subtotal = isAuthenticated && serverCart?.items && serverCart.items.length > 0
    ? (serverCart?.subtotal ?? 0)
    : localTotal();
  
  const demoOrderId = "EG-ORD-" + Math.floor(100000 + Math.random() * 900000);

  // 3. Validación corregida basada en la normalización unificada
  if (displayItems.length === 0) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-20 bg-white border border-gray-200 rounded-2xl p-8 mt-10 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">No hay productos para procesar</h2>
          <p className="text-sm text-gray-500 mt-2">Regresa al carrito e inyecta el curso de prueba.</p>
          <Link href="/carrito" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#2B55A3] text-white rounded-lg text-sm font-medium">
            <ArrowLeft size={16} /> Volver al Carrito
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={26} className="text-emerald-600" />
            Pantalla de Pago Seguro
          </h1>
          <p className="text-sm text-gray-500 mt-1">Finaliza tu matrícula utilizando nuestras pasarelas oficiales homologadas.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: SELECCIÓN DE PASARELA Y FORMULARIO */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Selector de Métodos de Pago */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">1. Selecciona tu método de pago</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mercado_pago")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                    paymentMethod === "mercado_pago"
                      ? "border-[#2B55A3] bg-blue-50/40 text-[#2B55A3]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <CreditCard size={22} />
                  <span className="text-xs font-bold">Mercado Pago (Bricks)</span>
                  <span className="text-[10px] text-gray-400">Tarjetas locales y Soles</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                    paymentMethod === "paypal"
                      ? "border-[#2B55A3] bg-blue-50/40 text-[#2B55A3]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Wallet size={22} />
                  <span className="text-xs font-bold">PayPal Smart Buttons</span>
                  <span className="text-[10px] text-gray-400">Internacional (USD)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                    paymentMethod === "stripe"
                      ? "border-[#2B55A3] bg-blue-50/40 text-[#2B55A3]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <CreditCard size={22} />
                  <span className="text-xs font-bold">Stripe Elements</span>
                  <span className="text-[10px] text-gray-400">Global Credit Card</span>
                </button>
              </div>
            </div>

            {/* CONTENEDOR DINÁMICO DE PASARELAS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider px-1">2. Procesar Transacción</h3>
              
              {paymentMethod === "mercado_pago" && (
                <div className="animate-fadeIn">
                  <MercadoPagoBrick orderId={demoOrderId} totalAmount={subtotal} />
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center space-y-4">
                  <div className="w-full py-3 bg-[#FFC439] text-[#003087] font-bold rounded-lg cursor-not-allowed text-sm shadow-sm">
                    <i>PayPal</i> Smart Checkout
                  </div>
                  <p className="text-xs text-gray-400">Módulo controlado por `PaypalAdapter` listo para producción.</p>
                </div>
              )}

              {paymentMethod === "stripe" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <div className="border border-gray-300 rounded-lg p-3 text-sm text-gray-400 flex items-center justify-between">
                    <span>Número de Tarjeta (Stripe Elements)</span>
                    <span className="text-xs font-mono">MM / AA / CVC</span>
                  </div>
                  <button className="w-full py-3 bg-[#635BFF] text-white font-semibold rounded-lg text-sm cursor-not-allowed">
                    Pagar con Stripe
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: RESUMEN LATERAL */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Resumen de Matrícula</h3>
              
              <div className="space-y-3">
                {displayItems.map((item: any) => (
                  <div key={item.id} className="text-xs flex gap-2 justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                      <p className="text-gray-400 text-[10px]">Acceso de por vida</p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">S/ {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-sm text-gray-900">
                <span>Total a transferir:</span>
                <span className="text-[#2B55A3] text-base">S/ {subtotal.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-gray-700">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Alumno: {user?.first_name || "Invitado Demo"}
                </p>
                <p>Código de Referencia: <span className="font-mono text-gray-700 font-medium">{demoOrderId}</span></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}