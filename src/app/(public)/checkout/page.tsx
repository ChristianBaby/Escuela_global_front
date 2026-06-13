"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PublicLayout } from "@/components/templates";
import { MercadoPagoBrick } from "@/components/organisms/MercadoPagoBrick";
import { PayPalButtonComponent } from "@/components/organisms/PayPalButtonComponent";
import { cartService } from "@/lib/services/cart";
// 🚀 AGREGADO: ShoppingBag para el botón de retorno
import { CreditCard, Wallet, ArrowLeft, CheckCircle2, ShieldCheck, Globe, ShoppingBag } from "lucide-react";
import Link from "next/link";

// Configuración de monedas y tipo de cambio base para la Demo (Base: PEN)
const GEO_CONFIG = {
  PE: { country: "Perú", currency: "PEN", symbol: "S/", rate: 1.0, activeGateway: "mercado_pago" },
  US: { country: "Estados Unidos", currency: "USD", symbol: "$", rate: 0.27, activeGateway: "paypal" },
  CO: { country: "Colombia", currency: "COP", symbol: "$", rate: 1080.0, activeGateway: "paypal" },
  CL: { country: "Chile", currency: "CLP", symbol: "$", rate: 250.0, activeGateway: "paypal" },
};

type CountryKey = keyof typeof GEO_CONFIG;

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuthStore();
  
  // 1. Estado de ubicación (Por defecto Perú 'PE')
  const [country, setCountry] = useState<CountryKey>("PE");

  // Petición del carrito
  const { data: serverCart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.get(),
    enabled: isAuthenticated,
  });
  
  const { items: localItems, total: localTotal } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "mercado_pago">("mercado_pago");

  // 📡 GEOLOCALIZACIÓN AUTOMÁTICA POR IP (Inicializa el país solo al montar la pantalla)
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const detectedCountry = data.country_code; // Devuelve "PE", "US", etc.
        if (detectedCountry in GEO_CONFIG) {
          setCountry(detectedCountry as CountryKey);
          console.log(`📡 [GEO IP] Ubicación inicial automatizada con éxito: ${detectedCountry}`);
        }
      })
      .catch((err) => {
        console.error("⚠️ [GEO IP ERROR] No se pudo determinar la IP, usando fallback PE:", err);
      });
  }, []);

  // Cambiar método por defecto según el país seleccionado (Soporta el "engaño" del selector manual)
  useEffect(() => {
    setPaymentMethod(GEO_CONFIG[country].activeGateway as "paypal" | "mercado_pago");
  }, [country]);

  // 🚀 NORMALIZACIÓN COMPLETA CON EXTRACTOR INTELIGENTE (Anti-envolturas del Backend)
  // Castemos temporalmente a 'any' para que TypeScript permita validar estructuras alternativas sin reclamar
  const serverCartAny = serverCart as any;

  const cartItemsRaw = serverCartAny?.items 
    || serverCartAny?.data?.items 
    || (Array.isArray(serverCartAny) ? serverCartAny : []);

  const baseSubtotal = isAuthenticated && cartItemsRaw.length > 0
    ? (serverCartAny?.subtotal ?? serverCartAny?.data?.subtotal ?? cartItemsRaw.reduce((acc: number, item: any) => acc + Number(item.course?.discount_price ?? item.course?.price ?? 0), 0))
    : localTotal();

  const displayItems = isAuthenticated && cartItemsRaw.length > 0
    ? cartItemsRaw.map((i: any) => ({
        id: i.course?.id || i.course_id,
        title: i.course?.title || "Curso Matriculado",
        price: Number(i.course?.discount_price ?? i.course?.price ?? 0),
      }))
    : localItems.map((e: any) => ({
        id: e.course.id,
        title: e.course.title,
        price: Number(e.course.discount_price ?? e.course.price),
      }));

  // 3. CÁLCULO LOCALIZADO: Multiplicamos el subtotal base por la tasa de cambio del país
  const currentGeo = GEO_CONFIG[country];
  const localizedSubtotal = baseSubtotal * currentGeo.rate;
  
  const demoOrderId = "EG-ORD-" + Math.floor(100000 + Math.random() * 900000);

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
        
        {/* BARRA DE DETECCIÓN DE UBICACIÓN (IDEAL PARA LA DEMO) */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#2B55A3]" />
            <span className="text-xs text-gray-600 font-medium">
              Ubicación detectada: <strong className="text-gray-900">{currentGeo.country}</strong> ({currentGeo.currency})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-400 font-bold uppercase">Simular País (Jurado):</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryKey)}
              className="text-xs bg-white border border-gray-300 rounded-lg p-1.5 font-medium text-gray-700 focus:outline-none focus:border-[#2B55A3]"
            >
              <option value="PE">🇵🇪 Perú (Soles - PEN)</option>
              <option value="US">🇺🇸 Estados Unidos (Dólares - USD)</option>
              <option value="CO">🇨🇴 Colombia (Pesos - COP)</option>
              <option value="CL">🇨🇱 Chile (Pesos - CLP)</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={26} className="text-emerald-600" />
            Pantalla de Pago Seguro
          </h1>
          <p className="text-sm text-gray-500 mt-1">Finaliza tu matrícula utilizando nuestras pasarelas internacionales.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: MÉTODOS DE PAGO */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">1. Selecciona tu método de pago</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <span className="text-xs font-bold">Mercado Pago (Local)</span>
                  <span className="text-[10px] text-gray-400">
                    {country === "PE" ? "Tarjetas de débito/crédito en Soles" : "No recomendado fuera de Perú"}
                  </span>
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
                  <span className="text-[10px] text-gray-400">Internacional (Conversión automática a USD)</span>
                </button>
              </div>
            </div>

            {/* CONTENEDOR DINÁMICO */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider px-1">2. Procesar Transacción</h3>
              
              {paymentMethod === "mercado_pago" && (
                <div className="animate-fadeIn">
                  <MercadoPagoBrick 
                    orderId={demoOrderId} 
                    totalAmount={localizedSubtotal} 
                    currency={currentGeo.currency} 
                  />
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="animate-fadeIn">
                  <PayPalButtonComponent orderId={demoOrderId} totalAmount={baseSubtotal} />
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: RESUMEN LATERAL LOCALIZADO */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Resumen de Matrícula</h3>
              
              <div className="space-y-3">
                {displayItems.map((item: any) => (
                  <div key={item.id} className="text-xs flex gap-2 justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                      <p className="text-gray-400 text-[10px]">Acceso inmediato</p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">
                      {currentGeo.symbol} {(item.price * currentGeo.rate).toFixed(currentGeo.currency === "COP" ? 0 : 2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-sm text-gray-900">
                <span>Total en {currentGeo.currency}:</span>
                <span className="text-[#2B55A3] text-base">
                  {currentGeo.symbol} {localizedSubtotal.toFixed(currentGeo.currency === "COP" ? 0 : 2)}
                </span>
              </div>

              {country !== "PE" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[10px] text-amber-800">
                  ⚠️ Al estar fuera de Perú, se aplicará la tasa de conversión internacional estándar.
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-gray-700">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Alumno: {user?.first_name || "Invitado Demo"}
                </p>
                <p>Referencia: <span className="font-mono text-gray-700 font-medium">{demoOrderId}</span></p>
              </div>
            </div>

            {/* 🚀 BOTÓN NUEVO: Volver a catálogo para continuar comprando */}
            <Link
              href="/cursos"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-[#2B55A3] text-gray-700 hover:text-[#2B55A3] font-medium py-3 rounded-xl transition-colors text-sm bg-white shadow-sm"
            >
              <ShoppingBag size={15} />
              Seguir comprando / Ver más cursos
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}