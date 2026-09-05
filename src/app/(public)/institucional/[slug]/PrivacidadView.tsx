"use client";

import { ShieldCheck, Mail, Lock } from "lucide-react";

export function PrivacidadView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">
        
        {/* Encabezado */}
        <div className="border-b border-gray-100 pb-5">
          <span className="text-[#2B55A3] font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Marco Legal de Datos
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading mt-3">
            Políticas de Privacidad
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Grupo Empresarial Especializaciones Global LLC (“Escuela Global”)
          </p>
        </div>

        {/* Introducción */}
        <div className="space-y-3 text-xs sm:text-sm text-gray-600">
          <p>
            Bienvenido al sitio web (el “Sitio”) de <strong>Grupo Empresarial Especializaciones Global LLC</strong> (“Escuela Global”, “nosotros”, indistintamente en adelante). Escuela Global proporciona una plataforma de servicios de capacitación y actualización profesional a nuestros Clientes (colectivamente, incluidos el Sitio y cualquier aplicación móvil y web relacionada, el “Servicio”). El Servicio está dirigido a nuestros Clientes y potenciales clientes que buscan fortalecer sus competencias profesionales.
          </p>
          <p>
            Esta Política de Privacidad explica los datos personales que recopilamos, cómo utilizamos y compartimos esos datos, y las opciones que tiene respecto a nuestras prácticas de datos. Al usar el Servicio, acepta las prácticas descritas en esta Política de Privacidad. Si no está de acuerdo, por favor no acceda al Sitio ni utilice el Servicio.
          </p>
          <p>
            Esta Política de Privacidad se incorpora y forma parte de nuestros Términos de Servicio.
          </p>
        </div>

        {/* Datos Personales que recopilamos */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#2B55A3] pl-3">
            Datos Personales que recopilamos
          </h2>
          <p className="text-xs sm:text-sm">
            Recopilamos información (“Datos Personales”) que, sola o en combinación con otra información en nuestra posesión, podría utilizarse para identificarlo de la siguiente manera:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm pl-2">
            <li>
              <strong>• Datos Personales que proporciona:</strong> Recopilamos Datos Personales cuando envía información a través de nuestra página “Registrarte” en el Sitio. Los datos recopilados generalmente incluirán: Nombre completo, tipo y número de documento de identidad, correo electrónico, número de WhatsApp, fecha de nacimiento, edad, género, dirección de facturación, país y carrera profesional.
            </li>
            <li>
              <strong>• Datos Personales recopilados en Redes Sociales:</strong> Tenemos páginas en redes sociales como Facebook, Twitter, YouTube, LinkedIn y otros (“Páginas de Redes Sociales”). Recopilamos los datos que elija proporcionarnos, y las plataformas pueden brindarnos información agregada y análisis sobre el uso de dichas páginas.
            </li>
            <li>
              <strong>• Datos personales automáticos del uso del servicio:</strong> Recibimos información sobre su visita, como visitas pico, páginas visitadas, dominios de origen (google.com, yahoo.com, etc.), navegadores y patrones de navegación:
              <ul className="pl-4 mt-2 space-y-1.5 text-xs text-gray-600">
                <li>- <em>Datos de registro:</em> Dirección IP, tipo y configuración del navegador, fecha y hora de la solicitud.</li>
                <li>- <em>Cookies:</em> Fragmentos enviados a su navegador para operar y administrar el Sitio.</li>
                <li>- <em>Información del dispositivo:</em> Nombre del dispositivo, sistema operativo y navegador utilizado.</li>
                <li>- <em>Información de uso:</em> Contenidos vistos, funciones usadas y duración de las actividades.</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Cookies y Analytics */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#2B55A3] pl-3">
            Cookies y Analytics
          </h2>
          <p className="text-xs sm:text-sm">
            Utilizamos cookies de sesión y persistentes para administrar el sitio y mejorar su experiencia. Asimismo, utilizamos <strong>Google Analytics</strong> (Google, Inc.) para analizar cómo los usuarios interactúan con el portal. Para saber más, visite <code>www.google.com/policies/privacy/partners/</code>.
          </p>
          <p className="text-xs sm:text-sm">
            <strong>Señales de “No rastrear” (DNT):</strong> Nuestro Sitio actualmente no responde a señales de DNT y opera conforme a lo descrito en este documento.
          </p>
          <p className="text-xs sm:text-sm">
            <strong>Sus opciones:</strong> Puede configurar su navegador (Internet Explorer, Mozilla Firefox, Google Chrome, Apple Safari) para rechazar cookies, entendiendo que esto podría limitar ciertas funciones del Sitio.
          </p>
        </section>

        {/* Cómo usamos los Datos Personales */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#2B55A3] pl-3">
            Cómo usamos los Datos Personales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong className="text-gray-900 block mb-1">Fines Académicos</strong>
              Gestionar matrículas, dar acceso al campus virtual web, agregarte a los grupos privados de WhatsApp, procesar evaluaciones, emitir certificados/constancias y verificar pagos.
            </div>
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong className="text-gray-900 block mb-1">Venta Asistida</strong>
              Permitir que nuestros asesores comerciales contacten (vía telefónica o WhatsApp) para brindarte detalles de cursos de tu interés.
            </div>
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong className="text-gray-900 block mb-1">Operación y Soporte</strong>
              Proveer el Servicio, responder consultas y enviar comunicaciones administrativas y actualizaciones de políticas.
            </div>
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
              <strong className="text-gray-900 block mb-1">Seguridad y Cumplimiento</strong>
              Prevenir fraudes, delitos o usos indebidos de sistemas de TI, y acatar obligaciones legales y regulatorias.
            </div>
          </div>
        </section>

        {/* Compartir y Divulgar Datos */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#2B55A3] pl-3">
            Compartir y Divulgar Datos Personales
          </h2>
          <p className="text-xs sm:text-sm">
            Compartimos datos con proveedores externos bajo medidas de seguridad adecuadas (hosting, nube, procesadores de pagos, CRM, soporte y análisis web). Asimismo, divulgaremos información por <strong>Requisitos Legales</strong> si fuese mandatorio para cumplir con procesos judiciales, de seguridad o protección de derechos.
          </p>
        </section>

        {/* Retención, Menores y Seguridad */}
        <section className="space-y-3 text-xs sm:text-sm">
          <h2 className="text-base font-bold text-gray-900 border-l-4 border-[#2B55A3] pl-3">
            Políticas Generales de Resguardo
          </h2>
          <p>
            <strong>Retención:</strong> Conservamos los datos durante el tiempo necesario para fines operativos, comerciales legítimos o por requerimiento fiscal y contable.
          </p>
          <p>
            <strong>Menores de edad:</strong> El servicio no está dirigido a niños menores de 13 años ni recopila deliberadamente sus datos.
          </p>
          <p>
            <strong>Seguridad:</strong> Implementamos medidas administrativas y técnicas razonables. No obstante, ninguna transmisión electrónica es 100% infalible.
          </p>
        </section>

        {/* Contacto */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Mail className="text-[#2B55A3]" size={20} />
            <div>
              <p className="text-xs font-bold text-gray-900">¿Consultas sobre tus datos personales?</p>
              <p className="text-xs text-gray-600">Escríbenos para rectificación o dudas a:</p>
            </div>
          </div>
          <a
            href="mailto:especializacionesglobal@gmail.com"
            className="text-xs font-bold text-[#2B55A3] hover:underline"
          >
            especializacionesglobal@gmail.com
          </a>
        </div>

      </div>
    </div>
  );
}