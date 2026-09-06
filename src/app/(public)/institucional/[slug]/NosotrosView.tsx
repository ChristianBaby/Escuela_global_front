"use client";

import { Target, Eye, BookOpenCheck, ShieldCheck, Globe2, Sparkles } from "lucide-react";

export function NosotrosView() {
  return (
    <div className="space-y-16 pb-16">
      {/* Banner Superior */}
      <section className="py-16 text-white text-center" style={{ backgroundColor: "#0B1230" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[#3FB1E5] font-bold text-xs uppercase tracking-widest bg-[#3FB1E5]/10 px-3.5 py-1.5 rounded-full border border-[#3FB1E5]/20">
            Sobre Escuela Global
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-4 font-heading">
            Programas de Alta Especialización
          </h1>
          <p className="text-white/70 text-sm max-w-xl mx-auto mt-3">
            Especialización práctica en minería, ingeniería y analítica para toda Latinoamérica.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#2B55A3]">
              <Target size={22} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-heading">Nuestra Misión</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Formar profesionales capacitados mediante proyectos reales y dominio de software de vanguardia, impulsando el desarrollo técnico y su inserción en los sectores industriales más exigentes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center text-[#3FB1E5]">
              <Eye size={22} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-heading">Nuestra Visión</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Consolidarnos como la institución líder en formación aplicada de ingeniería y tecnología en habla hispana, reconocida por su rigor metodológico y la validez de sus certificaciones.
            </p>
          </div>
        </div>

        {/* 🌟 BANNER DESTACADO: Eleva tus estándares académicos */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1230] via-[#1A2E66] to-[#0B1230] p-8 sm:p-12 text-center text-white shadow-lg border border-blue-900/40">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-[#3FB1E5]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-[#3FB1E5] text-xs font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <Sparkles size={13} />
              Compromiso de Excelencia
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight bg-gradient-to-r from-white via-blue-100 to-[#3FB1E5] bg-clip-text text-transparent">
              “Eleva tus estándares académicos”
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/80 font-normal">
              Contenidos diseñados por ingenieros y consultores activos para afrontar los retos reales del sector productivo.
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DIRECCIÓN ACADÉMICA - JEAN PIERRE CHAYÑA SALAS                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm">
          <div className="mb-6">
            <span className="text-xs font-bold text-[#2B55A3] uppercase tracking-wider">
              Equipo Académico
            </span>
            <h2 className="text-2xl font-bold text-gray-900 font-heading mt-1">
              Dirección y Respaldo Institucional
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* BLOQUE IZQUIERDO: FOTO LOCAL */}
            <div className="md:col-span-5 flex">
              <div className="w-full min-h-[340px] rounded-xl overflow-hidden bg-slate-100 border border-gray-200 relative group">
                <img
                  src="/PierreDirec.jpeg"
                  alt="Jean Pierre Chayña Salas - Dirección General"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-[11px] font-semibold px-2 py-1 bg-black/40 backdrop-blur-sm rounded">
                  Dirección General
                </span>
              </div>
            </div>

            {/* BLOQUE DERECHO: NOMBRE (ARRIBA) + DESCRIPCIÓN (ABAJO) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              {/* BLOQUE: NOMBRE Y TÍTULO */}
              <div className="border border-gray-200 bg-slate-50 p-5 rounded-xl">
                <h3 className="text-2xl font-extrabold text-gray-900 font-heading">
                  Jean Pierre Chayña Salas
                </h3>
                <p className="text-sm font-semibold text-[#2B55A3] mt-0.5">
                  Director General
                </p>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Economista Titulado egresado de la Universidad Nacional de San Antonio Abad del Cusco (UNSAAC)
                </p>
              </div>

              {/* BLOQUE: TRAYECTORIA Y DESCRIPCIÓN */}
              <div className="border border-gray-200 p-6 rounded-xl bg-white flex-1 flex flex-col justify-center space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Swim Trader Profesional, Value Investor y Emprendedor, con más de 10 años de experiencia en la gestión financiera estratégica de negocios y data analytics con una sólida formación académica en Finanzas y Ciencia de Datos y una destacada trayectoria laboral en diversas empresas multinacionales como consultor.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  "En Escuela Global nuestro objetivo principal es dotar al estudiante de herramientas prácticas ejecutables desde el primer día, con soporte constante y certificación oficial respaldada."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pilares */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
            <BookOpenCheck className="text-[#2B55A3]" size={26} />
            <h3 className="font-bold text-gray-900 text-sm">Enfoque 100% Práctico</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Casos reales y datasets de proyectos de la industria minera y de ingeniería.
            </p>
          </div>
          <div className="p-6 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
            <ShieldCheck className="text-emerald-600" size={26} />
            <h3 className="font-bold text-gray-900 text-sm">Certificación con QR</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Acreditación digital única con código hash verificable por reclutadores.
            </p>
          </div>
          <div className="p-6 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
            <Globe2 className="text-[#3FB1E5]" size={26} />
            <h3 className="font-bold text-gray-900 text-sm">Comunidad Latam</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Red internacional de estudiantes y docentes en foros activos y asesorías directas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}