"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/templates";
import { HeroSlider, PromoBanners, UpcomingLaunches, StaffCarousel, SoftwareCarousel, ScrollPopupModal, CertificateShowcase, AlliancesCarousel, CourseCarousel } from "@/components/organisms";
import { cursosService } from "@/lib/services/courses";

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-courses"],
    queryFn: () => cursosService.listCatalog({ limit: 8, sort: "popular", status: "published" }),
    staleTime: 5 * 60_000,
  });

  const courses = data?.data ?? [];

  return (
    <PublicLayout>
      {/* Popup promocional — aparece al hacer scroll */}
      <ScrollPopupModal />

      {/* Hero Slider — ocupa toda la pantalla */}
      <HeroSlider />

      {/* Publicaciones / Promociones activas */}
      <PromoBanners />

      {/* Próximos Lanzamientos */}
      <UpcomingLaunches />

      {/* Cursos destacados */}
      <section className="py-16" style={{ backgroundColor: "#0B1230" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-white font-bold text-sm uppercase tracking-widest">
                Destacados
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mt-2">Cursos más populares</h2>
              <div className="w-16 h-1 bg-white rounded-full mt-4" />
            </div>
            <a
              href="/cursos"
              className="text-sm font-medium text-white hover:text-brand-secondary transition-colors hidden sm:block"
            >
              Ver todos →
            </a>
          </div>
          <CourseCarousel
            courses={courses}
            loading={isLoading}
            emptyMessage="Los cursos estarán disponibles próximamente."
          />
        </div>
      </section>

      {/* Domina los siguientes softwares */}
      <SoftwareCarousel />

      {/* Nuestros Docentes */}
      <StaffCarousel />

      {/* Modelos de Certificados */}
      <CertificateShowcase />

      {/* Alianzas Estratégicas */}
      <AlliancesCarousel />
    </PublicLayout>
  );
}
