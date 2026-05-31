"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/templates";
import { HeroSlider, PromoBanners, CourseGrid } from "@/components/organisms";
import { cursosService } from "@/lib/services/courses";
import { BookOpen, Globe, TrendingUp, Award } from "lucide-react";

const BENEFITS = [
  {
    icon: BookOpen,
    title: "Contenido especializado",
    description: "Cursos diseñados por profesionales con amplia experiencia en cada área temática.",
  },
  {
    icon: Globe,
    title: "Acceso global",
    description: "Aprende desde cualquier lugar del mundo, a tu propio ritmo y sin horarios fijos.",
  },
  {
    icon: TrendingUp,
    title: "Avance profesional",
    description: "Desarrolla las competencias que el mercado laboral actual exige y demanda.",
  },
  {
    icon: Award,
    title: "Certifícate",
    description: "Obtén certificados respaldados por instructores líderes de la industria.",
  },
];

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-courses"],
    queryFn: () => cursosService.listCatalog({ limit: 8, sort: "popular", status: "published" }),
    staleTime: 5 * 60_000,
  });

  const courses = data?.data ?? [];

  return (
    <PublicLayout>
      {/* Hero Slider — ocupa toda la pantalla */}
      <HeroSlider />

      {/* Publicaciones / Promociones activas */}
      <PromoBanners />

      {/* Cursos destacados */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[#3FB1E5] font-bold text-xs uppercase tracking-widest">
                Destacados
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">Cursos más populares</h2>
            </div>
            <a
              href="/cursos"
              className="text-sm font-medium text-[#2B55A3] hover:text-[#3FB1E5] transition-colors hidden sm:block"
            >
              Ver todos →
            </a>
          </div>
          <CourseGrid
            courses={courses}
            loading={isLoading}
            emptyMessage="Los cursos estarán disponibles próximamente."
          />
        </div>
      </section>

      {/* Beneficios */}
      <section id="nosotros" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#3FB1E5] font-bold text-xs uppercase tracking-widest">
              ¿Por qué elegirnos?
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Crece · Globaliza · Profesionalízate
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Nuestra plataforma está diseñada para ayudarte a desarrollar competencias reales y
              actuales que potencian tu carrera.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#3FB1E5]/40 hover:shadow-sm transition-all text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2B55A3]/10 mb-4">
                  <Icon className="text-[#2B55A3]" size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#0f1f4d] py-20 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 30% 50%, #1a3a7a 0%, #0f1f4d 70%)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#3FB1E5] mb-4 border border-[#3FB1E5]/30 rounded-full px-3 py-1">
            Únete hoy
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Comienza tu especialización hoy
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Únete a más de 5,000 estudiantes que ya están avanzando en sus carreras.
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center bg-[#3FB1E5] hover:bg-[#3FB1E5]/90 text-white font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all shadow-lg"
          >
            Crear cuenta gratis
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
