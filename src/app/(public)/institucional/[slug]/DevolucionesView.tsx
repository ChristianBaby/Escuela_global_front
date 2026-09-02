"use client";

import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export function DevolucionesView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-gray-600 leading-relaxed">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-[#2B55A3] font-semibold text-xs uppercase tracking-wider">
            <RefreshCw size={16} /> Respaldo al Estudiante
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-heading mt-2">
            Políticas de Devolución y Reembolso
          </h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">1. Garantía de 7 Días</h2>
          <p>
            Ofrecemos un periodo de satisfacción de hasta <strong>siete (7) días calendario</strong> tras la inscripción. Si el curso no satisface tus expectativas pedagógicas, podrás solicitar el reembolso o el cambio de programa formativo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">2. Condiciones de Reembolso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={14} className="text-emerald-600" /> Válido para Reembolso
              </p>
              <ul className="text-xs text-emerald-800 space-y-1">
                <li>• Progreso menor al 20% del curso en la plataforma.</li>
                <li>• No haber generado el certificado de finalización.</li>
                <li>• Solicitud dentro de los 7 días posteriores al pago.</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-bold text-red-900 text-xs flex items-center gap-1.5 mb-2">
                <XCircle size={14} className="text-red-600" /> No Aplica
              </p>
              <ul className="text-xs text-red-800 space-y-1">
                <li>• Progreso superior al 20% en el aula virtual.</li>
                <li>• Descarga de datasets y plantillas complementarias.</li>
                <li>• Solicitudes fuera del plazo de 7 días.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">3. Solicitud y Reintegro</h2>
          <p>
            Comunícate a <strong className="text-[#2B55A3]">pagos@escuelaglobal.com</strong> con tu número de orden (ej. <code>EG-ORD-XXXXXX</code>) y el motivo. El reembolso se tramita a través de la pasarela original (Mercado Pago o PayPal) en un plazo de 2 a 5 días hábiles.
          </p>
        </section>
      </div>
    </div>
  );
}