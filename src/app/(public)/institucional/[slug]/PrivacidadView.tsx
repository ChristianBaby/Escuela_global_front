"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";

export function PrivacidadView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-gray-600 leading-relaxed">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} /> Ley N° 29733 (Perú)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-heading mt-2">
            Políticas de Privacidad
          </h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">1. Titularidad y Tratamiento</h2>
          <p>
            De acuerdo con la Ley N° 29733, los datos facilitados por el usuario serán incorporados al banco de datos de <strong>ESCUELA GLOBAL S.A.C.</strong> para gestionar la matrícula, emitir comprobantes fiscales y validar certificados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">2. Finalidad de los Datos</h2>
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#2B55A3]" /> Habilitación de accesos al Aula Virtual.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#2B55A3]" /> Emisión de certificados verificables con código QR.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#2B55A3]" /> Comprobantes de pago oficiales ante SUNAT.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">3. Ejercicio de Derechos ARCO</h2>
          <p>
            El titular puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición enviando un correo a <strong className="text-[#2B55A3]">privacidad@escuelaglobal.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}