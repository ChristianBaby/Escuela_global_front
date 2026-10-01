"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Wallet,
  Smartphone,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PublicLayout } from "@/components/templates";
import { AuthGateModal, type AuthGateMode } from "@/components/organisms";
import { MercadoPagoBrick } from "@/components/organisms/MercadoPagoBrick";
import { PayPalButtonComponent } from "@/components/organisms/PayPalButtonComponent";
import { CulqiCheckout } from "@/components/organisms/CulqiCheckout";
import { cartService } from "@/lib/services/cart";
import { ordersService } from "@/lib/services/orders";
import { getGuestSessionToken } from "@/lib/session";
import { extractCartItems, syncCartAfterAuth } from "@/lib/cart-sync";
import type { User } from "@/types";

function formatPrice(price: number, currency: string) {
  const symbol = currency === "PEN" ? "S/" : "$";
  return `${symbol} ${price.toFixed(2)}`;
}

// Moneda en la que el backend crea la orden según el método: Mercado Pago y
// Culqi liquidan en soles (cuentas de Perú); PayPal no acepta PEN y cobra en
// USD con el precio en dólares del curso.
type CheckoutPaymentMethod = "paypal" | "mercado_pago" | "culqi";
const currencyFor = (method: CheckoutPaymentMethod) => (method === "paypal" ? "USD" : "PEN");

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const { items: localItems, total: localTotal } = useCartStore();
  const [guestSessionToken] = useState(() => getGuestSessionToken());
  const queryClient = useQueryClient();

  const [order, setOrder] = useState<{ id: string; total: number; currency: string } | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("mercado_pago");

  // true mientras se revisa, justo después de loguearse en el modal, si algún
  // curso del carrito ya estaba comprado por esta cuenta — evita que el
  // efecto de abajo cree una orden real (le cobre) antes de esa limpieza.
  const [syncingAfterAuth, setSyncingAfterAuth] = useState(false);

  // Igual que en el resto del sitio (login/registro): un modal que se
  // superpone sobre la página en vez de un formulario propio del checkout.
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthGateMode>("login");

  // Carrito real (invitado o logueado)
  const { data: serverCart } = useQuery({
    queryKey: ["cart", isAuthenticated ? "auth" : guestSessionToken],
    queryFn: () => cartService.get(isAuthenticated ? undefined : guestSessionToken),
  });

  const cartItemsRaw = extractCartItems(serverCart);

  // El backend no deduplica /cart/add por curso, así que un mismo curso puede
  // haber quedado con más de una fila en el carrito (p. ej. si se agregó desde
  // "Añadir al carrito" y luego desde "Comprar ahora"). Nos quedamos solo con
  // la primera fila por curso para no cobrar ni mostrar el mismo curso 2 veces.
  const serverDisplayItems = Array.from(
    new Map(
      cartItemsRaw.map((i) => [
        i.courseId,
        {
          id: i.courseId,
          title: i.title ?? "Curso",
          price: Number(i.finalPrice ?? i.discountPrice ?? i.price ?? 0),
        },
      ])
    ).values()
  );
  const localDisplayItems = localItems.map((e) => ({
    id: e.course.id,
    title: e.course.title,
    price: Number(e.course.discount_price_pen ?? e.course.price_pen),
  }));
  // Logueado: el carrito del servidor es SIEMPRE la fuente de verdad, aunque
  // venga en 0 — nunca se cae al espejo local. Invitado: el carrito real
  // vive bloqueado en el backend, así que ahí sí el espejo local es la única
  // fuente posible.
  const displayItems = isAuthenticated
    ? serverDisplayItems
    : (serverDisplayItems.length > 0 ? serverDisplayItems : localDisplayItems);

  const localSubtotal = displayItems.reduce((sum: number, i) => sum + i.price, 0) || localTotal();

  // Al llegar sin sesión con cursos en el carrito, se ofrece de una vez el
  // modal de inicio de sesión / registro (igual que la página se vería con
  // el modal ya abierto), en vez de mostrar el checkout vacío/bloqueado.
  useEffect(() => {
    if (!isAuthenticated && displayItems.length > 0) {
      setAuthModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, displayItems.length > 0]);

  // Al llegar autenticado (login previo o justo iniciado sesión) creamos la
  // orden real. Si el alumno cambia a un método que cobra en otra moneda
  // (PayPal ↔ MP/Culqi), se crea una orden nueva en esa moneda; la anterior
  // queda pendiente sin pagar.
  useEffect(() => {
    const needsOrder = !order || order.currency !== currencyFor(paymentMethod);
    if (isAuthenticated && needsOrder && !creatingOrder && !syncingAfterAuth && displayItems.length > 0) {
      setCreatingOrder(true);
      ordersService
        .create({ payment_method: paymentMethod })
        .then((res) => setOrder(res))
        .catch((error) =>
          toast.error(error?.response?.data?.message ?? "No se pudo generar la orden de compra")
        )
        .finally(() => setCreatingOrder(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, displayItems.length, paymentMethod, order, syncingAfterAuth]);

  // Se ejecuta al iniciar sesión o registrarse desde el modal — el carrito de
  // invitado (local/session_token) se funde con el carrito real de la cuenta
  // recién autenticada para que la compra continúe con lo que ya eligió.
  async function handleAuthenticated(authUser: User) {
    setSyncingAfterAuth(true);
    setUser(authUser);
    try {
      // Funde el carrito de invitado con el de la cuenta y saca del carrito
      // cualquier curso que la cuenta ya tenga comprado — no tiene sentido
      // cobrárselo de nuevo.
      const { removedAlreadyOwned, totalItemsBeforeCleanup } = await syncCartAfterAuth(guestSessionToken);

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAuthModalOpen(false);

      if (removedAlreadyOwned.length > 0) {
        const first = removedAlreadyOwned[0];
        toast.info(
          removedAlreadyOwned.length === 1
            ? `Ya estás matriculado en "${first.title}" — no hace falta comprarlo de nuevo.`
            : `Ya estás matriculado en ${removedAlreadyOwned.length} de estos cursos — se quitaron del carrito.`,
          {
            duration: 8000,
            action: { label: "Continuar viendo", onClick: () => router.push(`/curso/${first.courseId}`) },
          }
        );
      }

      if (totalItemsBeforeCleanup > 0 && removedAlreadyOwned.length === totalItemsBeforeCleanup) {
        // Todo el carrito eran cursos que ya tenía — no queda nada por pagar.
        router.push(`/curso/${removedAlreadyOwned[0].courseId}`);
        return;
      }

      toast.success("¡Bienvenido! Ya puedes continuar con el pago.");
    } finally {
      setSyncingAfterAuth(false);
    }
  }

  if (displayItems.length === 0) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-20 bg-white border border-gray-200 rounded-2xl p-8 mt-10 shadow-sm">
          <h2 className="text-xl font-bold text-brand-primary">Tu carrito está vacío</h2>
          <p className="text-sm text-gray-500 mt-2">Agrega cursos al carrito para continuar con la compra.</p>
          <Link href="/carrito" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#084D95] text-white rounded-lg text-sm font-medium">
            <ArrowLeft size={16} /> Volver al Carrito
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const currency = order?.currency ?? "PEN";
  const total = order?.total ?? localSubtotal;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-primary flex items-center gap-2">
            <ShieldCheck size={26} className="text-emerald-600" />
            Finalizar compra
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAuthenticated ? "Elige tu método de pago para completar la matrícula." : "Inicia sesión o crea una cuenta para continuar."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {!isAuthenticated ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                  <LogIn size={26} className="text-[#084D95]" />
                </div>
                <h3 className="text-lg font-bold text-brand-primary">Inicia sesión para continuar</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Para finalizar tu compra, primero debes iniciar sesión o crear una cuenta en la plataforma.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}
                    className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-semibold transition-colors"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => { setAuthMode("register"); setAuthModalOpen(true); }}
                    className="px-5 py-2.5 rounded-xl border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/5 text-sm font-semibold transition-colors"
                  >
                    Crear cuenta
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-4">1. Selecciona tu método de pago</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mercado_pago")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                        paymentMethod === "mercado_pago"
                          ? "border-[#084D95] bg-blue-50/40 text-[#084D95]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard size={22} />
                      <span className="text-xs font-bold">Mercado Pago (Latam)</span>
                      <span className="text-[10px] text-gray-400">Tarjetas de débito/crédito locales</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("culqi")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                        paymentMethod === "culqi"
                          ? "border-[#084D95] bg-blue-50/40 text-[#084D95]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Smartphone size={22} />
                      <span className="text-xs font-bold">Culqi (Tarjeta / Yape)</span>
                      <span className="text-[10px] text-gray-400">Tarjetas locales y Yape</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("paypal")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                        paymentMethod === "paypal"
                          ? "border-[#084D95] bg-blue-50/40 text-[#084D95]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Wallet size={22} />
                      <span className="text-xs font-bold">PayPal Smart Buttons</span>
                      <span className="text-[10px] text-gray-400">Internacional (USD)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider px-1">2. Procesar transacción</h3>

                  {creatingOrder || !order || order.currency !== currencyFor(paymentMethod) ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2 bg-white rounded-xl border border-gray-200">
                      <Loader2 size={28} className="animate-spin text-[#084D95]" />
                      <p className="text-xs text-gray-400">Preparando tu orden de compra…</p>
                    </div>
                  ) : paymentMethod === "mercado_pago" ? (
                    <div className="animate-fadeIn">
                      <MercadoPagoBrick orderId={order.id} totalAmount={order.total} currency={order.currency} />
                    </div>
                  ) : paymentMethod === "culqi" ? (
                    <div className="animate-fadeIn">
                      <CulqiCheckout orderId={order.id} totalAmount={order.total} currency={order.currency} />
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                      <PayPalButtonComponent orderId={order.id} totalAmount={order.total} currency={order.currency} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* COLUMNA DERECHA: RESUMEN */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-gray-100 pb-2">Resumen de Matrícula</h3>

              <div className="space-y-3">
                {displayItems.map((item) => (
                  <div key={item.id} className="text-xs flex gap-2 justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                      <p className="text-gray-400 text-[10px]">Acceso inmediato</p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">{formatPrice(item.price, currency)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-sm text-gray-900">
                <span>Total:</span>
                <span className="text-[#084D95] text-base">{formatPrice(total, currency)}</span>
              </div>

              {isAuthenticated && (
                <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
                  <p className="flex items-center gap-1 font-semibold text-gray-700">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Alumno: {user?.first_name} {user?.last_name}
                  </p>
                  {order && (
                    <p>Orden: <span className="font-mono text-gray-700 font-medium">{order.id.slice(0, 8)}</span></p>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/cursos"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-[#084D95] text-gray-700 hover:text-[#084D95] font-medium py-3 rounded-xl transition-colors text-sm bg-white shadow-sm"
            >
              <ShoppingBag size={15} />
              Seguir comprando / Ver más cursos
            </Link>
          </div>
        </div>
      </div>

      <AuthGateModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthenticated={handleAuthenticated}
      />
    </PublicLayout>
  );
}
