"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; 
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PublicLayout } from "@/components/templates";
import { CheckCircle2, BookOpen, ArrowRight, Download, Calendar, ShieldCheck, FileText } from "lucide-react";

// 🚀 Traemos la misma configuración geolocalizada para poder hacer la conversión en la boleta
const GEO_CONFIG = {
  PE: { country: "Perú", currency: "PEN", symbol: "S/", rate: 1.0 },
  US: { country: "Estados Unidos", currency: "USD", symbol: "$" },
  CO: { country: "Colombia", currency: "COP", symbol: "$" }, 
  CL: { country: "Chile", currency: "CLP", symbol: "$" },    
};

type CountryKey = keyof typeof GEO_CONFIG;

export default function CheckoutSuccessPage() {
  const { user } = useAuthStore();
  const { items: cartItems, clearCart } = useCartStore();
  const [ticketNumber, setTicketNumber] = useState("");
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  
  // 🚀 Estado para recordar el país simulado en el checkout
  const [invoiceCountry, setInvoiceCountry] = useState<CountryKey>("PE");

  useEffect(() => {
    // 1. Recuperamos qué país se usó en la compra (Por defecto Perú 'PE')
    const savedCountry = localStorage.getItem("checkout_country") as CountryKey;
    if (savedCountry && savedCountry in GEO_CONFIG) {
      setInvoiceCountry(savedCountry);
    }

    // Caso A: Primera carga
    if (cartItems.length > 0) {
      const items = cartItems.map(item => item.course);
      const totalCalculated = cartItems.reduce((sum, item) => {
        const price = item.course.discount_price ?? item.course.price;
        return sum + Number(price);
      }, 0);
      const ticket = "OP-" + Math.floor(100000 + Math.random() * 900000);

      setPurchasedItems(items);
      setInvoiceTotal(totalCalculated);
      setTicketNumber(ticket);

      localStorage.setItem("latest_invoice", JSON.stringify({
        items,
        total: totalCalculated,
        ticket,
        country: savedCountry || "PE"
      }));

      // Registro en el Aula Virtual
      const newEnrollments = cartItems.map((item) => ({
        id: "demo-enr-" + Math.floor(100000 + Math.random() * 900000),
        course_id: item.course.id,
        progress_percent: 0,
        completed_at: null,
        last_accessed_at: new Date().toISOString(),
        total_watched_seconds: 0,
        has_review: false,
        course: item.course,
      }));

      const existingEnrollmentsRaw = localStorage.getItem("demo_enrollments");
      const existingEnrollments = existingEnrollmentsRaw ? JSON.parse(existingEnrollmentsRaw) : [];
      const combined = [...existingEnrollments];
      newEnrollments.forEach((newE) => {
        if (!combined.some((oldE) => oldE.course_id === newE.course_id)) {
          combined.push(newE);
        }
      });

      localStorage.setItem("demo_enrollments", JSON.stringify(combined));
      clearCart();

    } else {
      // Caso B: Contingencia F5
      const savedInvoice = localStorage.getItem("latest_invoice");
      if (savedInvoice) {
        const { items, total, ticket, country: invoiceSavedCountry } = JSON.parse(savedInvoice);
        setPurchasedItems(items);
        setInvoiceTotal(total);
        setTicketNumber(ticket);
        if (invoiceSavedCountry) setInvoiceCountry(invoiceSavedCountry);
      }
    }
  }, [cartItems, clearCart]);

  const fechaActual = new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 🚀 RED DE CONVERSIÓN MULTIDIVISA PARA LA FACTURA ELECTRÓNICA
  // Definimos las tasas inversas de correspondencia respecto a la base del Checkout para que cuadre perfecto
  const ratesConfig = { PE: 1.0, US: 0.27, CO: 1080.0, CL: 250.0 };
  const currentRate = ratesConfig[invoiceCountry] || 1.0;
  const currentGeo = GEO_CONFIG[invoiceCountry] || GEO_CONFIG.PE;

  // Multiplicamos el total base en soles por la tasa del país correspondiente
  const localizedTotal = invoiceTotal * currentRate;
  const subtotalContable = localizedTotal / 1.18;
  const igvContable = localizedTotal - subtotalContable;
  
  const isCOP = currentGeo.currency === "COP";

  return (
    <PublicLayout>
      <style>{`
        @media print {
          header, footer, nav, aside, button, .print\\:hidden, #navbar, #footer {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #comprobante-factura-a4 {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 40px !important;
          }
        }
      `}</style>

      {/* ─── INTERFAZ WEB EN PANTALLA ─── */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center print:hidden">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-6 animate-fadeIn">
          
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              ¡Matrícula Completada con Éxito!
            </h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              El pago ha sido procesado de forma segura. Ya tienes acceso inmediato a tu ruta de aprendizaje en Escuela Global.
            </p>
          </div>

          {/* Resumen en Pantalla */}
          <div className="bg-slate-50 rounded-xl p-5 border border-gray-100 text-left max-w-md mx-auto space-y-3 text-xs text-gray-600">
            <div className="flex justify-between pb-2 border-b border-gray-200/60 font-semibold text-gray-800">
              <span>Detalle de la Transacción</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={12} /> Homologada ({currentGeo.currency})
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Estudiante:</span>
              <span className="font-medium text-gray-900">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : "Alumno Demo"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">N° de Operación:</span>
              <span className="font-mono font-medium text-gray-900">{ticketNumber || "Generando..."}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Monto Abonado:</span>
              <span className="font-bold text-gray-900 text-sm">
                {currentGeo.symbol} {localizedTotal.toFixed(isCOP ? 0 : 2)}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-200/60 font-bold text-gray-900 text-sm">
              <span>Estado del Pago:</span>
              <span className="text-emerald-600">PAGADO</span>
            </div>
          </div>

          {/* Botones */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2B55A3] hover:bg-[#2B55A3]/90 text-white font-medium px-6 py-3 rounded-xl shadow-sm transition-colors text-sm"
            >
              <BookOpen size={16} />
              Ir a mi Aula Virtual
              <ArrowRight size={16} />
            </Link>

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-5 py-3 rounded-xl transition-colors text-sm bg-white shadow-sm"
            >
              <Download size={16} />
              Descargar Recibo (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* ─── COMPROBANTE OFICIAL A4 (DINÁMICO SEGÚN EL PAÍS DE COMPRA) ─── */}
      <div id="comprobante-factura-a4" className="hidden print:block w-full max-w-4xl mx-auto p-12 text-black bg-white text-left font-sans">
        <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#2B55A3] font-bold text-2xl tracking-tight">
              <div className="p-1.5 bg-[#2B55A3] text-white rounded-lg">
                <FileText size={20} />
              </div>
              ESCUELA GLOBAL
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">ESCUELA GLOBAL S.A.C.</p>
            <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">Av. de la Cultura 742, Wanchaq, Cusco, Perú</p>
            <p className="text-[11px] text-gray-400">Contacto: soporte@escuelaglobal.com</p>
          </div>
          <div className="border-2 border-black rounded-xl p-5 text-center min-w-[220px] bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">R.U.C. 20784512963</h2>
            <h1 className="text-sm font-black uppercase my-1 text-[#2B55A3]">BOLETA DE VENTA</h1>
            <p className="text-xs font-mono font-bold text-gray-900 mt-1">{ticketNumber?.replace("OP", "BE01")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 my-6 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Datos del Adquiriente</h3>
            <p><strong className="text-gray-500">Estudiante:</strong> <span className="text-gray-900 font-semibold">{user?.first_name ? `${user.first_name} ${user.last_name || ""}` : "Alumno Demo"}</span></p>
            <p><strong className="text-gray-500">Email:</strong> <span className="text-gray-900">{user?.email || "correo@demo.com"}</span></p>
          </div>
          <div className="space-y-1.5 pl-10">
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Información de Operación</h3>
            <p><strong className="text-gray-500">Fecha de Emisión:</strong> <span className="text-gray-900">{fechaActual}</span></p>
            <p><strong className="text-gray-500">Moneda Fiscal:</strong> <span className="text-gray-900 font-bold">{currentGeo.currency} ({currentGeo.country})</span></p>
            <p><strong className="text-gray-500">Condición de Pago:</strong> <span className="text-emerald-700 font-bold">CONTADO (PAGADO)</span></p>
          </div>
        </div>

        <table className="w-full text-xs text-left mt-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-wider font-bold">
              <th className="p-3 rounded-l-lg">Descripción del Curso / Servicio</th>
              <th className="p-3 text-center w-24">Cantidad</th>
              <th className="p-3 text-right w-32 rounded-r-lg">Valor Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchasedItems.map((course, idx) => {
              const basePrice = Number(course.discount_price ?? course.price);
              const itemLocalizedPrice = basePrice * currentRate;
              return (
                <tr key={idx} className="text-gray-900 font-medium">
                  <td className="p-3 py-4">
                    <p className="font-bold text-gray-900">{course.title}</p>
                    <p className="text-[10px] text-gray-400 font-normal mt-0.5">Acceso inmediato y permanente a la ruta LMS</p>
                  </td>
                  <td className="p-3 py-4 text-center text-gray-600">1</td>
                  <td className="p-3 py-4 text-right font-semibold">
                    {currentGeo.symbol} {itemLocalizedPrice.toFixed(isCOP ? 0 : 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="w-64 space-y-2 text-xs border-t-2 border-gray-100 pt-4">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Op. Gravada:</span>
              <span className="tabular-nums text-gray-900">{currentGeo.symbol} {subtotalContable.toFixed(isCOP ? 0 : 2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 font-medium">
              <span>I.G.V. / Impuestos (18.00%):</span>
              <span className="tabular-nums text-gray-900">{currentGeo.symbol} {igvContable.toFixed(isCOP ? 0 : 2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2">
              <span>Importe Total:</span>
              <span className="text-[#2B55A3] tabular-nums">{currentGeo.symbol} {localizedTotal.toFixed(isCOP ? 0 : 2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-dashed border-gray-300 pt-6 text-center space-y-4">
          <div className="flex justify-center gap-12 text-[10px] text-gray-500 font-medium">
            <p className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" /> Transacción Homologada Internacionalmente
            </p>
            <p>Representación impresa de Comprobante Digital emitido para {currentGeo.country}</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}