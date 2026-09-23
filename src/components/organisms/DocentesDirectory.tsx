"use client";

import { useState } from "react";
import { GraduationCap, Briefcase, BookOpen, Code2, Award, UserCheck, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface Docente {
  id: string;
  first_name: string;
  last_name: string;
  academic_degree: string;
  specialty: string;
  colegiatura?: string;
  photo_url: string;
  experience_years: number;
  bio: string;
  software_tools: string[];
  courses_taught: string[];
}

const DOCENTES: Docente[] = [
  {
    id: "1",
    first_name: "Jean Pierre",
    last_name: "Chayña Salas",
    academic_degree: "Economista Titulado (UNSAAC)",
    specialty: "Gestión Financiera Estratégica & Data Analytics",
    colegiatura: "Titulado UNSAAC",
    photo_url: "/PierreDirec.jpeg",
    experience_years: 10,
    bio: "Swim Trader Profesional, Value Investor y Emprendedor, con más de 10 años de experiencia en la gestión financiera estratégica de negocios y data analytics con una sólida formación académica en Finanzas y Ciencia de Datos y una destacada trayectoria laboral en diversas empresas multinacionales como consultor.",
    software_tools: ["Python", "Power BI", "SQL", "Excel Financiero", "MetaTrader 5"],
    courses_taught: ["Data Analytics & Machine Learning Financiero", "Trading Cuantitativo"],
  },
  {
    id: "2",
    first_name: "Carlos",
    last_name: "Mendoza Rivas",
    academic_degree: "Magíster en Geomecánica Aplicada",
    specialty: "Estabilidad de Taludes y Minería Subterránea",
    colegiatura: "CIP 184520",
    photo_url: "/PierreDirec.jpeg",
    experience_years: 15,
    bio: "Ingeniero con amplia experiencia liderando operaciones y modelamiento numérico en minería a tajo abierto y subterránea en Perú y Latinoamérica.",
    software_tools: ["Rocscience (Slide, RS2)", "FLAC3D", "Datamine"],
    courses_taught: ["Geomecánica Aplicada a Minería Subterránea", "Modelamiento Numérico de Macizos"],
  },
  {
    id: "3",
    first_name: "Valeria",
    last_name: "Sotomayor Peña",
    academic_degree: "Especialista BIM & Modelado Estructural",
    specialty: "Ingeniería Civil y Coordinación Multidisciplinaria",
    colegiatura: "CIP 210495",
    photo_url: "/PierreDirec.jpeg",
    experience_years: 8,
    bio: "Especialista en flujos de trabajo BIM bajo estándares internacionales ISO 19650 y detección de interferencias en obras de gran envergadura.",
    software_tools: ["Revit", "Navisworks", "ETABS", "Dynamo"],
    courses_taught: ["Gestión BIM de Infraestructura", "Cálculo Estructural Avanzado"],
  },
];

export function DocentesDirectory() {
  const [selected, setSelected] = useState<Docente | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DOCENTES.map((docente) => (
          <div
            key={docente.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
          >
            {/* Foto local */}
            <div className="h-52 bg-slate-100 relative overflow-hidden">
              <img
                src={docente.photo_url}
                alt={`${docente.first_name} ${docente.last_name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-800 flex items-center gap-1 shadow-2xs">
                <GraduationCap size={13} className="text-[#084D95]" />
                <span className="truncate max-w-[180px]">{docente.academic_degree}</span>
              </div>
            </div>

            {/* Datos principales */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {docente.first_name} {docente.last_name}
                </h3>
                <p className="text-xs text-[#084D95] font-medium mt-1 truncate">
                  {docente.specialty}
                </p>
              </div>

              {/* Botón Detalles */}
              <button
                type="button"
                onClick={() => setSelected(docente)}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-[#084D95] text-gray-700 hover:text-white border border-gray-200 hover:border-[#084D95] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                Ver detalles <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de información detallada */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg p-0 overflow-hidden bg-white border border-gray-200 rounded-2xl max-h-[85vh] flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>{selected.first_name} {selected.last_name}</DialogTitle>
            </DialogHeader>

            <div className="overflow-y-auto p-6 space-y-5">
              {/* Cabecera del modal */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-gray-200 shrink-0">
                  <img
                    src={selected.photo_url}
                    alt={selected.first_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#084D95] bg-blue-50 px-2 py-0.5 rounded">
                    {selected.academic_degree}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1 truncate">
                    {selected.first_name} {selected.last_name}
                  </h3>
                  {selected.colegiatura && (
                    <p className="text-xs text-gray-400 font-mono">{selected.colegiatura}</p>
                  )}
                </div>
              </div>

              {/* Trayectoria */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-[#084D95]" /> Perfil Profesional
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selected.bio}
                </p>
              </div>

              {/* Software */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <Code2 size={14} className="text-[#084D95]" /> Herramientas y Software
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.software_tools.map((st) => (
                    <span
                      key={st}
                      className="px-2 py-0.5 bg-slate-100 text-gray-700 text-xs rounded font-medium"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cursos */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#084D95]" /> Cursos a cargo
                </h4>
                <ul className="space-y-1.5">
                  {selected.courses_taught.map((c, i) => (
                    <li key={i} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#084D95]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}