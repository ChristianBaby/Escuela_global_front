"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { slidersService } from "@/lib/services/marketing";
import { ChevronLeft, ChevronRight, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Slider } from "@/types";

// ── Fallback cuando no hay sliders activos ─────────────────────────────────────
function FallbackHero() {
  return (
    <section
      className="relative w-full h-screen min-h-[600px] flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #1a3a7a 60%, #2B55A3 100%)" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-16 w-full">
        <div className="max-w-xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#3FB1E5] mb-5 border border-[#3FB1E5]/40 rounded-full px-4 py-1.5">
            Escuela Global
          </span>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
            Programas de<br />
            <span className="text-[#3FB1E5]">Alta Especialización</span>
          </h1>
          <p className="text-white/75 text-lg leading-relaxed mb-8">
            Formación de alto nivel con los mejores especialistas para impulsar tu carrera profesional.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cursos"
              className="inline-flex items-center bg-[#2B55A3] hover:bg-[#3FB1E5] text-white font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-105 gap-2 shadow-lg"
            >
              <BookOpen size={18} />
              Ver programas
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

// ── Slide individual (imagen de fondo + texto + botones) ───────────────────────
function CourseSlide({ slider }: { slider: Slider }) {
  const hasImage = !!slider.image_url;

  return (
    <div className="relative w-full h-full flex items-center">
      {/* Background image */}
      {hasImage ? (
        <img
          src={slider.image_url}
          alt={slider.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #1a3a7a 55%, #2B55A3 100%)" }}
        />
      )}

      {/* Gradient overlay — pesado a la izquierda para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background: hasImage
            ? "linear-gradient(to right, rgba(15,31,77,0.93) 0%, rgba(15,31,77,0.78) 35%, rgba(15,31,77,0.45) 65%, rgba(15,31,77,0.15) 100%)"
            : "none",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-16 w-full">
        <div className="max-w-xl">
          {slider.event_type && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#3FB1E5] mb-5 border border-[#3FB1E5]/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
              {slider.event_type.name}
            </span>
          )}

          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            {slider.title}
          </h2>

          {slider.subtitle && (
            <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-8 drop-shadow max-w-md">
              {slider.subtitle}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            {/* Botón principal — asesor comercial */}
            {slider.contact_url ? (
              <a
                href={slider.contact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#2B55A3] hover:bg-[#3FB1E5] text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 gap-2 shadow-lg shadow-black/30"
              >
                <MessageCircle size={18} />
                Más Información
              </a>
            ) : (
              <Link
                href={slider.destination_url ?? "/cursos"}
                className="inline-flex items-center bg-[#2B55A3] hover:bg-[#3FB1E5] text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 gap-2 shadow-lg shadow-black/30"
              >
                <MessageCircle size={18} />
                Más Información
              </Link>
            )}

            {/* Botón secundario — ver catálogo */}
            <Link
              href="/cursos"
              className="inline-flex items-center border-2 border-white/40 text-white hover:bg-white/10 font-semibold px-6 py-3.5 rounded-xl transition-all backdrop-blur-sm gap-2"
            >
              <BookOpen size={16} />
              Ver catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function HeroSlider() {
  const { data: sliders = [], isLoading } = useQuery({
    queryKey: ["sliders"],
    queryFn: slidersService.list,
  });

  const activeSliders = sliders
    .filter((s) => s.status === "active")
    .sort((a, b) => a.display_order - b.display_order);

  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      setCurrent((idx + activeSliders.length) % Math.max(activeSliders.length, 1));
    },
    [activeSliders.length]
  );

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeSliders.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % activeSliders.length);
      }, 6000);
    }
  }, [activeSliders.length]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handleNav = (dir: number) => {
    goTo(current + dir);
    resetTimer();
  };

  if (isLoading) {
    return (
      <section
        className="relative w-full h-screen min-h-[600px] animate-pulse"
        style={{ background: "#0f1f4d" }}
      />
    );
  }

  if (activeSliders.length === 0) return <FallbackHero />;

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-[#0f1f4d]">
      {/* Slides con transición de opacidad */}
      {activeSliders.map((slider, i) => (
        <div
          key={slider.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
        >
          <CourseSlide slider={slider} />
        </div>
      ))}

      {/* Flechas de navegación */}
      {activeSliders.length > 1 && (
        <>
          <button
            onClick={() => handleNav(-1)}
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all flex items-center justify-center text-white border border-white/20 hover:border-white/40"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => handleNav(1)}
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all flex items-center justify-center text-white border border-white/20 hover:border-white/40"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots de navegación */}
      {activeSliders.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activeSliders.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetTimer(); }}
              aria-label={`Ir al slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 h-2.5 bg-[#3FB1E5]"
                  : "w-2.5 h-2.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Contador */}
      {activeSliders.length > 1 && (
        <div className="absolute bottom-10 right-6 z-20 text-white/50 text-xs font-medium tabular-nums">
          {current + 1} / {activeSliders.length}
        </div>
      )}

      {/* Ola inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
