"use client";

import { FileText, Award, Calendar, AlertCircle } from "lucide-react";

export function TerminosView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">
        
        {/* Encabezado */}
        <div className="border-b border-gray-100 pb-5">
          <span className="text-[#2B55A3] font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Régimen Contractual
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading mt-3">
            Términos y Condiciones
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Última actualización: Septiembre 2026
          </p>
        </div>

        {/* 1. Partes Intervinientes */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">1. Partes Intervinientes</h2>
          <p className="text-xs sm:text-sm">
            Servicios ofrecidos por <strong>Grupo Empresarial Especializaciones Global LLC</strong> con EIN 42-4731456 (el “Prestador”) a través de <code>https://escuelaglobal.net/</code> a usted (el “Usuario”). Estos términos tienen carácter obligatorio y vinculante. El uso del Sitio constituye aceptación plena. Si no está de acuerdo, debe abstenerse de utilizar el Sitio.
          </p>
        </section>

        {/* 2. Solicitud de Información */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">2. Solicitud de Información</h2>
          <p className="text-xs sm:text-sm">
            Para solicitar acceso a Clases, Campus Virtual, Videos, Materiales o Instaladores, el Usuario garantiza suministrar información exacta y veraz. Al consultar o registrarse, autoriza el contacto comercial vía e-mail, teléfono o WhatsApp y el almacenamiento de datos conforme a la normativa vigente.
          </p>
        </section>

        {/* 3. Prestación de Servicios */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">3. Prestación de Servicios</h2>
          <ul className="space-y-1.5 text-xs sm:text-sm pl-3">
            <li>• Los pagos realizados por el Usuario no son reembolsables bajo ninguna causa.</li>
            <li>• El pago no obliga la prestación si el Usuario no envía la documentación solicitada.</li>
            <li>• Se prohíbe eludir la plataforma para acordar relaciones jurídicas privadas directas con docentes puestos en contacto por el Prestador.</li>
          </ul>
        </section>

        {/* 4. Vigencia del Acceso y Uso de Cuenta */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">4. Vigencia del Acceso y Uso de Cuenta</h2>
          <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-2 text-xs sm:text-sm">
            <p><strong>• Vigencia de 1 Año:</strong> El acceso al Grupo Privado de WhatsApp y al Campus Virtual Web tiene una duración máxima de <strong>un (1) año</strong> contado desde la inscripción.</p>
            <p><strong>• Prohibición de cuentas compartidas:</strong> Sesiones simultáneas desde múltiples ubicaciones conllevarán suspensión definitiva de la cuenta sin derecho a reclamo.</p>
            <p><strong>• Requisitos técnicos:</strong> Es deber del alumno contar con conectividad y dispositivos compatibles para el correcto seguimiento de las sesiones.</p>
          </div>
        </section>

        {/* 5. Asistencia y Modalidades de Clase */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">5. Asistencia y Modalidades de Clase</h2>
          <p className="text-xs sm:text-sm">
            <strong>Cursos en Vivo (Síncronos):</strong> Requieren asistencia puntual y activa. Las consultas personalizadas fuera de la clase grupal están sujetas a disponibilidad y cotización independiente del docente.
          </p>
          <p className="text-xs sm:text-sm">
            <strong>Cursos Pregrabados (Asincrónicos):</strong> El alumno debe visualizar de forma obligatoria la totalidad de las clases grabadas dentro del periodo de vigencia.
          </p>
        </section>

        {/* 6. Evaluación y Certificación Académica */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">6. Evaluación y Certificación Académica</h2>
          <ul className="space-y-2 text-xs sm:text-sm pl-2">
            <li>• <strong>Alumnos Síncronos:</strong> Evaluados mediante exámenes y proyectos con nota mínima aprobatoria.</li>
            <li>• <strong>Alumnos Asincrónicos:</strong> Plazo máximo obligatorio de <strong>7 días calendario</strong> tras concluir el programa para entregar evaluaciones.</li>
            <li>• <strong>Examen Subsanatorio:</strong> Opción sujeta a un costo administrativo adicional si no se alcanza la nota mínima aprobatoria.</li>
            <li>• <strong>Constancia Simple:</strong> Si no se sustentan notas aprobatorias, solo se expedirá constancia de participación simple sin código QR.</li>
          </ul>
        </section>

        {/* 7. Condiciones para Becarios y Descuentos */}
        <section className="space-y-2 bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-xs sm:text-sm">
          <h3 className="font-bold text-[#2B55A3]">7. Condiciones para Becarios y Descuentos</h3>
          <p>• Seguir todas las redes sociales oficiales y remitir la constancia al coordinador.</p>
          <p>• <strong>Testimonio Obligatorio:</strong> Grabar y remitir un video testimonial sobre su experiencia formativa.</p>
          <p>• Máximo dos (2) becas por persona al año. Certificados sujetos a aprobación de exámenes. Vales o medias becas no acumulables.</p>
        </section>

        {/* 8. Atención al Cliente */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">8. Atención al Cliente</h2>
          <p className="text-xs sm:text-sm">
            Tiempo de respuesta estimado de <strong>24 a 48 horas hábiles</strong>. No se garantizan respuestas inmediatas fuera del horario laboral.
          </p>
        </section>

        {/* 9 a 14: Cláusulas Finales */}
        <section className="space-y-3 text-xs text-gray-600 border-t border-gray-100 pt-4">
          <p><strong>9. Responsabilidad:</strong> El Prestador no asume responsabilidad por daños derivados del uso de la información, ni por fallas en servidores o internet.</p>
          <p><strong>10. Prohibiciones:</strong> Prohibido el espionaje industrial, difusión de virus, suplantación de identidad y uso indebido del material.</p>
          <p><strong>11. Propiedad Intelectual:</strong> Todo el material y software alojado es propiedad de Escuela Global o de sus respectivos titulares licenciantes.</p>
          <p><strong>12. Indemnidad:</strong> El Usuario mantendrá indemne al Prestador frente a reclamos de terceros derivados del mal uso del servicio.</p>
          <p><strong>13. Modificaciones:</strong> Las actualizaciones se publicarán en esta sección con notificación periódica.</p>
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-lg text-gray-800 font-medium">
            <strong>14. Domicilio Legal:</strong> 30 N Gould St Ste R, Sheridan, WY 82801, USA.
          </div>
        </section>

      </div>
    </div>
  );
}