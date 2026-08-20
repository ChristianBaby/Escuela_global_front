"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PublicLayout } from "@/components/templates";
import { FormField, PasswordField } from "@/components/molecules";
import { Button, Label } from "@/components/atoms";
import { MercadoPagoBrick } from "@/components/organisms/MercadoPagoBrick";
import { PayPalButtonComponent } from "@/components/organisms/PayPalButtonComponent";
import { cartService } from "@/lib/services/cart";
import { authService } from "@/lib/services/auth";
import { ordersService } from "@/lib/services/orders";
import { getGuestSessionToken } from "@/lib/session";
import { COUNTRIES, PROFESSIONS } from "@/lib/constants/checkout-options";
import { cn } from "@/lib/utils";

function formatPrice(price: number, currency: string) {
  const symbol = currency === "PEN" ? "S/" : "$";
  return `${symbol} ${price.toFixed(2)}`;
}

const guestSchema = z
  .object({
    nombres: z.string().min(2, "Ingresa tu(s) nombre(s)"),
    apellidos: z.string().min(2, "Ingresa tus apellidos"),
    country: z.string().min(1, "Selecciona tu país"),
    phone: z.string().min(6, "Teléfono inválido").max(15, "Teléfono inválido"),
    email: z.string().email("Ingresa un correo válido"),
    profession: z.string().min(1, "Selecciona tu carrera profesional"),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .refine((d) => !d.password || d.password.length >= 8, {
    message: "La contraseña debe tener mínimo 8 caracteres",
    path: ["password"],
  })
  .refine((d) => !d.password || d.password === d.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });

type GuestFormData = z.infer<typeof guestSchema>;

type EmailStatus = "idle" | "checking" | "available" | "exists";

// La cuenta de Mercado Pago configurada en este proyecto es de Perú y solo puede
// liquidar en esa moneda (cada cuenta de MP está atada a un único país/moneda).
const MERCADOPAGO_SUPPORTED_CURRENCY = "PEN";

export default function CheckoutPage() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const { items: localItems, total: localTotal } = useCartStore();
  const [guestSessionToken] = useState(() => getGuestSessionToken());

  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [order, setOrder] = useState<{ id: string; total: number; currency: string } | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "mercado_pago">("mercado_pago");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: { country: "PE" },
  });

  const watchCountry = watch("country");
  const watchPassword = watch("password") ?? "";
  const selectedCountry = COUNTRIES.find((c) => c.code === watchCountry);

  // Carrito real (invitado o logueado)
  const { data: serverCart } = useQuery({
    queryKey: ["cart", isAuthenticated ? "auth" : guestSessionToken],
    queryFn: () => cartService.get(isAuthenticated ? undefined : guestSessionToken),
  });

  const serverCartAny = serverCart as any;
  const cartItemsRaw =
    serverCartAny?.items ?? serverCartAny?.data?.items ?? (Array.isArray(serverCartAny) ? serverCartAny : []);

  const displayItems =
    cartItemsRaw.length > 0
      ? cartItemsRaw.map((i: any) => ({
          id: i.courseId ?? i.course?.id ?? i.course_id,
          title: i.title ?? i.course?.title ?? "Curso",
          price: Number(i.finalPrice ?? i.discountPrice ?? i.price ?? i.course?.discount_price ?? i.course?.price ?? 0),
        }))
      : localItems.map((e) => ({
          id: e.course.id,
          title: e.course.title,
          price: Number(e.course.discount_price ?? e.course.price),
        }));

  const localSubtotal = displayItems.reduce((sum: number, i: any) => sum + i.price, 0) || localTotal();

  // Al llegar autenticado (login previo o justo registrado) creamos la orden real
  useEffect(() => {
    if (isAuthenticated && !order && !creatingOrder && displayItems.length > 0) {
      setCreatingOrder(true);
      ordersService
        .create({ payment_method: paymentMethod })
        .then((res) => setOrder(res))
        .catch(() => toast.error("No se pudo generar la orden de compra"))
        .finally(() => setCreatingOrder(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, displayItems.length]);

  const mercadoPagoAvailable = !order || order.currency === MERCADOPAGO_SUPPORTED_CURRENCY;

  // Si la orden resulta en una moneda que Mercado Pago no puede procesar (p. ej. USD),
  // forzamos el cambio a PayPal para no ofrecer una opción que va a fallar al pagar.
  useEffect(() => {
    if (order && order.currency !== MERCADOPAGO_SUPPORTED_CURRENCY && paymentMethod === "mercado_pago") {
      setPaymentMethod("paypal");
    }
  }, [order, paymentMethod]);

  async function handleEmailBlur(email: string) {
    if (!email || !z.string().email().safeParse(email).success) return;
    setEmailStatus("checking");
    try {
      const res = await authService.checkEmail(email);
      setEmailStatus(res.available ? "available" : "exists");
    } catch {
      setEmailStatus("idle");
    }
  }

  const onSubmitGuestForm = async (data: GuestFormData) => {
    if (emailStatus !== "available") return;
    if (!data.password) return;

    try {
      const phone = `${selectedCountry?.dial ?? ""}${data.phone.replace(/\D/g, "")}`;
      const res = await authService.register({
        first_name: data.nombres.trim(),
        last_name: data.apellidos.trim(),
        email: data.email,
        phone,
        password: data.password,
        country: data.country,
        profession: data.profession,
      });

      setUser(res.user);
      await cartService.merge(guestSessionToken).catch(() => null);
      toast.success("¡Cuenta creada! Ya puedes continuar con el pago.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo crear la cuenta. Intenta nuevamente.");
    }
  };

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
            {isAuthenticated ? "Elige tu método de pago para completar la matrícula." : "Completa tus datos para continuar."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {!isAuthenticated ? (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-4">Tus datos</h3>
                <form onSubmit={handleSubmit(onSubmitGuestForm)} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Nombre(s)"
                      placeholder="Juan Carlos"
                      error={errors.nombres?.message}
                      required
                      {...register("nombres")}
                    />
                    <FormField
                      label="Apellidos"
                      placeholder="Pérez García"
                      error={errors.apellidos?.message}
                      required
                      {...register("apellidos")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      País <span className="text-red-500" aria-hidden>*</span>
                    </Label>
                    <select
                      {...register("country")}
                      className={cn(
                        "w-full border rounded-lg px-3 h-10 text-sm bg-white text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
                        errors.country ? "border-red-400" : "border-gray-300"
                      )}
                    >
                      <option value="">Selecciona tu país</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Celular <span className="text-red-500" aria-hidden>*</span>
                    </Label>
                    <div className="flex">
                      <div className="flex items-center gap-1.5 px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600 shrink-0 select-none">
                        <span>{selectedCountry?.flag ?? "🌍"}</span>
                        <span className="font-medium tabular-nums">{selectedCountry?.dial ?? ""}</span>
                      </div>
                      <input
                        type="tel"
                        placeholder="999 999 999"
                        className={cn(
                          "flex-1 border rounded-r-lg px-3 h-10 text-sm outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
                          errors.phone ? "border-red-400" : "border-gray-300"
                        )}
                        {...register("phone")}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                  </div>

                  <FormField
                    label="Correo electrónico"
                    type="email"
                    placeholder="tu@correo.com"
                    error={errors.email?.message}
                    required
                    {...register("email", { onBlur: (e) => handleEmailBlur(e.target.value) })}
                  />

                  {emailStatus === "checking" && (
                    <p className="text-xs text-gray-400">Verificando correo…</p>
                  )}

                  {emailStatus === "exists" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      ¿Ya eres cliente?{" "}
                      <Link
                        href={`/auth/login?redirect=/checkout`}
                        className="font-semibold underline hover:text-amber-900"
                      >
                        Haz clic aquí para iniciar sesión
                      </Link>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      Carrera profesional <span className="text-red-500" aria-hidden>*</span>
                    </Label>
                    <select
                      {...register("profession")}
                      className={cn(
                        "w-full border rounded-lg px-3 h-10 text-sm bg-white text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
                        errors.profession ? "border-red-400" : "border-gray-300"
                      )}
                    >
                      <option value="">Selecciona tu carrera profesional</option>
                      {PROFESSIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {errors.profession && <p className="text-xs text-red-500">{errors.profession.message}</p>}
                  </div>

                  {emailStatus === "available" && (
                    <>
                      <PasswordField
                        label="Contraseña"
                        placeholder="Mínimo 8 caracteres"
                        error={errors.password?.message}
                        required
                        showStrength
                        value={watchPassword}
                        {...register("password")}
                      />
                      <PasswordField
                        label="Confirmar contraseña"
                        placeholder="Repite tu contraseña"
                        error={errors.password_confirmation?.message}
                        required
                        {...register("password_confirmation")}
                      />
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 font-semibold"
                      >
                        {isSubmitting ? "Creando cuenta…" : "Crear cuenta y continuar"}
                      </Button>
                    </>
                  )}
                </form>
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-4">1. Selecciona tu método de pago</h3>
                  <div className={`grid grid-cols-1 gap-3 ${mercadoPagoAvailable ? "sm:grid-cols-2" : ""}`}>
                    {mercadoPagoAvailable && (
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
                    )}

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
                  {!mercadoPagoAvailable && (
                    <p className="text-[11px] text-gray-400 mt-3">
                      Mercado Pago solo está disponible para pagos en soles (PEN). Este curso está en{" "}
                      {order?.currency}, así que usa PayPal.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider px-1">2. Procesar transacción</h3>

                  {creatingOrder || !order ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2 bg-white rounded-xl border border-gray-200">
                      <Loader2 size={28} className="animate-spin text-[#084D95]" />
                      <p className="text-xs text-gray-400">Preparando tu orden de compra…</p>
                    </div>
                  ) : paymentMethod === "mercado_pago" ? (
                    <div className="animate-fadeIn">
                      <MercadoPagoBrick orderId={order.id} totalAmount={order.total} currency={order.currency} />
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                      <PayPalButtonComponent orderId={order.id} totalAmount={order.total} />
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
                {displayItems.map((item: any) => (
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
    </PublicLayout>
  );
}
