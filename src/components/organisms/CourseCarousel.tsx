"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CourseCard, CourseCardSkeleton } from "@/components/molecules";
import type { Course } from "@/types";

interface CourseCarouselProps {
  courses: Course[];
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  /** "dark" (por defecto): flechas blancas translúcidas, para fondos oscuros (ej. home).
   *  "light": flechas oscuras, para usar sobre fondo blanco (ej. página de un curso). */
  arrowsTheme?: "dark" | "light";
}

export function CourseCarousel({
  courses,
  loading = false,
  skeletonCount = 4,
  emptyMessage = "No se encontraron cursos.",
  arrowsTheme = "dark",
}: CourseCarouselProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Navigation]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        navigation
        onBeforeInit={(swiper) => {
          const nav = swiper.params.navigation;
          if (nav && typeof nav !== "boolean") {
            nav.prevEl = prevRef.current;
            nav.nextEl = nextRef.current;
          }
        }}
        loop={courses.length > 4}
        centerInsufficientSlides
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 28 },
          // A 1024px muchos laptops "normales" (ej. 1366px con escalado de Windows
          // al 125%) quedan por debajo de 1280 en px CSS reales — por eso el salto
          // a 4 tarjetas arranca aquí y no en el antiguo umbral xl (1280).
          1024: { slidesPerView: 4, spaceBetween: 40 },
        }}
        className="!pb-2"
      >
        {courses.map((course) => (
          <SwiperSlide key={course.id} className="h-auto py-1">
            <CourseCard course={course} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Flechas de navegación — mismo estilo circular del HeroSlider, en dos variantes de color */}
      <button
        ref={prevRef}
        aria-label="Anterior"
        className={`absolute -left-4 sm:left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full backdrop-blur-sm transition-all flex items-center justify-center [&.swiper-button-disabled]:opacity-0 [&.swiper-button-disabled]:pointer-events-none ${
          arrowsTheme === "light"
            ? "bg-white text-brand-primary border border-gray-200 shadow-md hover:bg-gray-50"
            : "bg-white/10 hover:bg-white/25 text-white border border-white/20 hover:border-white/40"
        }`}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        ref={nextRef}
        aria-label="Siguiente"
        className={`absolute -right-4 sm:right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full backdrop-blur-sm transition-all flex items-center justify-center [&.swiper-button-disabled]:opacity-0 [&.swiper-button-disabled]:pointer-events-none ${
          arrowsTheme === "light"
            ? "bg-white text-brand-primary border border-gray-200 shadow-md hover:bg-gray-50"
            : "bg-white/10 hover:bg-white/25 text-white border border-white/20 hover:border-white/40"
        }`}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
