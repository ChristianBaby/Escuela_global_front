"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, BookOpen, ArrowRight, ShieldCheck, FileText, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { ordersService } from "@/lib/services/orders";

function formatPrice(price: number, currency: string) {
  const symbol = currency === "PEN" ? "S/" : "$";
  return `${symbol} ${price.toFixed(2)}`;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <PublicLayout>
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 size={28} className="animate-spin text-[#084D95] mx-auto" />
          </div>
        </PublicLayout>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersService.get(orderId as string),
    enabled: !!orderId,
  });

  const fechaActual = new Date(order?.created_at ?? Date.now()).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!orderId) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <p className="text-gray-500">No se encontró información de la orden.</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#084D95] text-white rounded-lg text-sm font-medium">
            Ir a mi Aula Virtual
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (isLoading || !order) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <Loader2 size={28} className="animate-spin text-[#084D95] mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Cargando comprobante…</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* ─── INTERFAZ WEB EN PANTALLA ─── */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center print:hidden">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-6 animate-fadeIn">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-primary tracking-tight">
              ¡Matrícula Completada con Éxito!
            </h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              El pago ha sido procesado de forma segura. Ya tienes acceso inmediato a tu ruta de aprendizaje en Escuela Global.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-gray-100 text-left max-w-md mx-auto space-y-3 text-xs text-gray-600">
            <div className="flex justify-between pb-2 border-b border-gray-200/60 font-semibold text-gray-800">
              <span>Detalle de la Transacción</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={12} /> Homologada ({order.currency})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Estudiante:</span>
              <span className="font-medium text-gray-900">{order.billing_name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">N° de Orden:</span>
              <span className="font-mono font-medium text-gray-900">{order.order_number}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Monto Abonado:</span>
              <span className="font-bold text-gray-900 text-sm">{formatPrice(order.total, order.currency)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-200/60 font-bold text-gray-900 text-sm">
              <span>Estado del Pago:</span>
              <span className="text-emerald-600">{order.payment_status === "paid" ? "PAGADO" : order.payment_status.toUpperCase()}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#084D95] hover:bg-[#084D95]/90 text-white font-medium px-6 py-3 rounded-xl shadow-sm transition-colors text-sm"
            >
              <BookOpen size={16} />
              Ir a mi Aula Virtual
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── COMPROBANTE OFICIAL A4 ─── */}
      <div id="comprobante-factura-a4" className="hidden print:block w-full max-w-4xl mx-auto p-12 text-black bg-white text-left font-sans">
        <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#084D95] font-bold text-2xl tracking-tight">
              <div className="p-1.5 bg-[#084D95] text-white rounded-lg">
                <FileText size={20} />
              </div>
              ESCUELA GLOBAL
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">ESCUELA GLOBAL S.A.C.</p>
            <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">Av. de la Cultura 742, Wanchaq, Cusco, Perú</p>
            <p className="text-[11px] text-gray-400">Contacto: soporte@escuelaglobal.com</p>
          </div>
          <div className="border-2 border-black rounded-xl p-5 text-center min-w-[220px] bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Comprobante de Pago</h2>
            <h1 className="text-sm font-black uppercase my-1 text-[#084D95]">BOLETA DE VENTA</h1>
            <p className="text-xs font-mono font-bold text-gray-900 mt-1">{order.order_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Datos del Adquiriente</h3>
            <p><strong className="text-gray-500">Estudiante:</strong> <span className="text-gray-900 font-semibold">{order.billing_name}</span></p>
            <p><strong className="text-gray-500">Email:</strong> <span className="text-gray-900">{order.billing_email}</span></p>
          </div>
          <div className="space-y-1.5 sm:pl-10">
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Información de Operación</h3>
            <p><strong className="text-gray-500">Fecha de Emisión:</strong> <span className="text-gray-900">{fechaActual}</span></p>
            <p><strong className="text-gray-500">Moneda:</strong> <span className="text-gray-900 font-bold">{order.currency}</span></p>
            <p><strong className="text-gray-500">Condición de Pago:</strong> <span className="text-emerald-700 font-bold">CONTADO (PAGADO)</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-xs text-left mt-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-wider font-bold">
              <th className="p-3 rounded-l-lg">Descripción del Curso / Servicio</th>
              <th className="p-3 text-center w-24">Cantidad</th>
              <th className="p-3 text-right w-32 rounded-r-lg">Valor Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <tr key={idx} className="text-gray-900 font-medium">
                <td className="p-3 py-4">
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">Acceso inmediato y permanente a la ruta LMS</p>
                </td>
                <td className="p-3 py-4 text-center text-gray-600">1</td>
                <td className="p-3 py-4 text-right font-semibold">{formatPrice(item.final_price, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-64 space-y-2 text-xs border-t-2 border-gray-100 pt-4">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Subtotal:</span>
              <span className="tabular-nums text-gray-900">{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2">
              <span>Importe Total:</span>
              <span className="text-[#084D95] tabular-nums">{formatPrice(order.total, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-dashed border-gray-300 pt-6 text-center space-y-4">
          <div className="flex justify-center gap-12 text-[10px] text-gray-500 font-medium">
            <p className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" /> Transacción Homologada
            </p>
            <p>Representación impresa del comprobante digital</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
