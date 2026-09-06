"use client";

import { AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";

export function DevolucionesView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">
        
        {/* Encabezado */}
        <div className="border-b border-gray-100 pb-5">
          <span className="text-[#2B55A3] font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Términos Comerciales
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading mt-3">
            Políticas de Reembolso
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Grupo Empresarial Especializaciones Global LLC (el “Prestador”)
          </p>
        </div>

        {/* 1. Naturaleza de los Pagos */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">1. Naturaleza de los Pagos</h2>
          <p className="text-xs sm:text-sm">
            Todos los pagos efectuados por el Usuario a favor de <strong>Grupo Empresarial Especializaciones Global LLC</strong> tienen carácter <strong>firme, definitivo e irrevocable</strong>. El Usuario reconoce y acepta que, una vez efectuado el pago —por cualquier medio de pago disponible, incluyendo pero no limitándose a transferencias bancarias, tarjetas de crédito o débito, plataformas de pago electrónico o criptomonedas—, <strong>no procederá bajo ningún concepto la devolución total o parcial de las sumas abonadas</strong>.
          </p>
        </section>

        {/* 2. Exclusión de Derecho de Retracto */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">2. Exclusión de Derecho de Retracto</h2>
          <p className="text-xs sm:text-sm">
            El Usuario renuncia expresamente a invocar cualquier derecho de retracto, revocación o desistimiento conforme a la legislación de consumo aplicable, en virtud de:
          </p>
          <div className="space-y-2.5 text-xs sm:text-sm pl-2">
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong>a) Reserva de cupo:</strong> La inscripción implica la reserva y bloqueo de un cupo limitado dentro de un grupo académico con fecha programada, impidiendo asignar dicha vacante a otro postulante.
            </div>
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong>b) Entrega inmediata de recursos:</strong> El Servicio incluye licencias, instaladores de software, guías y materiales digitales de descarga cuya entrega ocurre de forma previa o simultánea al inicio de clases.
            </div>
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong>c) Costos no recuperables:</strong> Las capacitaciones se ejecutan de manera colectiva y programada, incurriendo el Prestador en costos logísticos y honorarios docentes no recuperables desde la matrícula.
            </div>
          </div>
        </section>

        {/* 3. Falta de Documentación */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">3. Falta de Envío de Información o Documentación</h2>
          <p className="text-xs sm:text-sm">
            La falta de entrega por parte del Usuario de la información y/o documentación requerida por el Prestador no genera derecho a reembolso. El Prestador queda liberado de ejecutar el servicio hasta recibir lo solicitado, sin obligación de reintegro alguno.
          </p>
        </section>

        {/* 4. Cancelaciones por el Prestador */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">4. Cancelaciones por el Prestador</h2>
          <p className="text-xs sm:text-sm">
            El Prestador podrá cancelar unilateralmente el servicio por incumplimiento de obligaciones, falsedad documental, uso indebido o actividades ilícitas. En tales casos, el Usuario no tendrá derecho a reembolso y el Prestador podrá retener las sumas como indemnización por daños y perjuicios.
          </p>
        </section>

        {/* 5. Contracargos y Disputas de Pago */}
        <section className="space-y-2 bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldAlert size={18} className="text-amber-700" />
            5. Contracargos y Disputas de Pago
          </div>
          <p className="text-xs text-amber-950">
            El Usuario se compromete a no iniciar contracargos ni disputas ante pasarelas o entidades bancarias salvo falta total de ejecución exclusiva del Prestador. Cualquier intento injustificado constituye un incumplimiento grave que habilitará el cobro de daños, costas y honorarios legales.
          </p>
        </section>

        {/* 6. Aplicación de Créditos */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">6. Aplicación de Créditos</h2>
          <p className="text-xs sm:text-sm">
            En situaciones excepcionales y a sola discreción del Prestador, se podrá ofrecer la aplicación del monto como crédito para otros servicios dentro de los <strong>ciento ochenta (180) días</strong> siguientes al pago. Dicho crédito no es dinerario ni reembolsable.
          </p>
        </section>

        {/* 7. Aceptación Expresa */}
        <section className="space-y-2 pt-2 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900">7. Aceptación Expresa</h2>
          <p className="text-xs text-gray-500">
            Al contratar cualquiera de los servicios, el Usuario declara haber leído, comprendido y aceptado íntegramente la presente Política de Reembolso, renunciando a formular reclamos o acciones tendientes a la devolución de sumas abonadas.
          </p>
        </section>

      </div>
    </div>
  );
}