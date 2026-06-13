"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; 
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PublicLayout } from "@/components/templates";
import { CheckCircle2, BookOpen, ArrowRight, Download, Calendar, ShieldCheck } from "lucide-react";

export default function CheckoutSuccessPage() {
  const { user } = useAuthStore();
  const { items: cartItems, clearCart } = useCartStore();
  const [ticketNumber, setTicketNumber] = useState("");

  useEffect(() => {
    // 🚀 CLAVE DE SEGURIDAD: Solo ejecutamos la lógica si hay elementos por procesar
    if (cartItems.length > 0) {
      // 1. Convertimos los ítems del carrito al formato 'Enrollment'
      const newEnrollments = cartItems.map((item) => ({
        id: "demo-enr-" + Math.floor(100000 + Math.random() * 900000),
        course_id: item.course.id,
        progress_percent: 0, // Cursos nuevos empiezan en 0%
        completed_at: null,
        last_accessed_at: new Date().toISOString(),
        total_watched_seconds: 0,
        has_review: false,
        course: item.course,
      }));

      // 2. Leemos inscripciones previas de la simulación
      const existingEnrollmentsRaw = localStorage.getItem("demo_enrollments");
      const existingEnrollments = existingEnrollmentsRaw ? JSON.parse(existingEnrollmentsRaw) : [];

      // 3. Unimos los nuevos evitando duplicados
      const combined = [...existingEnrollments];
      newEnrollments.forEach((newE) => {
        if (!combined.some((oldE) => oldE.course_id === newE.course_id)) {
          combined.push(newE);
        }
      });

      // 4. Guardamos en el baúl persistente de la demo
      localStorage.setItem("demo_enrollments", JSON.stringify(combined));

      // 5. 🟢 Mover clearCart() AQUÍ ADENTRO rompe el bucle infinito por completo
      clearCart();
    }

    // Generamos el número de operación solo si está vacío (evita que cambie al re-renderizar)
    if (!ticketNumber) {
      setTicketNumber("OP-" + Math.floor(100000 + Math.random() * 900000));
    }
  }, [cartItems, clearCart, ticketNumber]);

  const fechaActual = new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        
        {/* Contenedor Principal */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-6 animate-fadeIn">
          
          {/* Éxito Icono */}
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-950 tracking-tight">
              ¡Matrícula Completada con Éxito!
            </h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              El pago ha sido procesado de forma segura. Ya tienes acceso inmediato a tu ruta de aprendizaje en Escuela Global.
            </p>
          </div>

          {/* Comprobante de la Demo */}
          <div className="bg-slate-50 rounded-xl p-5 border border-gray-100 text-left max-w-md mx-auto space-y-3 text-xs text-gray-600">
            <div className="flex justify-between pb-2 border-b border-gray-200/60 font-semibold text-gray-800">
              <span>Detalle de la Transacción</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={12} /> Homologada
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
              <span className="font-mono font-medium text-gray-900">{ticketNumber}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Fecha de Acceso:</span>
              <span className="font-medium text-gray-900 flex items-center gap-1">
                <Calendar size={12} /> {fechaActual}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-200/60 font-bold text-gray-900 text-sm">
              <span>Estado del Pago:</span>
              <span className="text-emerald-600">PAGADO</span>
            </div>
          </div>

          {/* Botones de Acción */}
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-5 py-3 rounded-xl transition-colors text-sm bg-white"
            >
              <Download size={16} />
              Descargar Recibo (PDF)
            </button>
          </div>

        </div>

        <p className="text-xs text-gray-400 mt-6">
          Se ha enviado un correo electrónico de confirmación con los detalles de tus accesos y la factura digital correspondiente.
        </p>
      </div>
    </PublicLayout>
  );
}