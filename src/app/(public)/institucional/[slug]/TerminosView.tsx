"use client";

import { FileText, AlertCircle } from "lucide-react";

export function TerminosView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-gray-600 leading-relaxed">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-[#2B55A3] font-semibold text-xs uppercase tracking-wider">
            <FileText size={16} /> Marco Legal Institucional
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-heading mt-2">
            Términos y Condiciones de Uso
          </h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">1. Aceptación del Servicio</h2>
          <p>
            El uso de la plataforma académica y la compra de cursos implican la aceptación de los presentes términos suscritos con <strong>ESCUELA GLOBAL S.A.C.</strong>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">2. Acceso y Uso del Aula Virtual</h2>
          <p>
            Las cuentas de usuario y los accesos a los programas son de carácter individual e intransferible. Queda prohibida la compartición de credenciales o la reproducción masiva no autorizada del material pedagógico.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">3. Propiedad Intelectual</h2>
          <p>
            Todo el material instructivo, código fuente, videos en streaming y guías son propiedad intelectual exclusiva de Escuela Global.
          </p>
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Está prohibida la descarga, distribución o comercialización no autorizada del contenido.</span>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">4. Emisión de Certificados</h2>
          <p>
            Para expedir el certificado oficial verificable con código QR, el alumno debe completar el 100% de las clases y aprobar las evaluaciones con una calificación mínima de 14/20.
          </p>
        </section>
      </div>
    </div>
  );
}