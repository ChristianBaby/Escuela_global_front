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
      className="relative w-full h-screen min-h-[600px] overflow-hidden"
      style={{ background: "linear-gradient(135deg, #052E59 0%, #084D95 65%, #23AFE5 100%)" }}
    >
      {/* Acentos decorativos — motivo circular de marca */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-40 h-40 rounded-full bg-[#23AFE5]/20 blur-2xl pointer-events-none" />

      <div className="absolute inset-x-0 bottom-16 md:bottom-20 z-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#23AFE5] mb-5 border border-[#23AFE5]/40 rounded-full px-4 py-1.5">
            Escuela Global
          </span>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
            Programas de<br />
            <span className="text-[#23AFE5]">Alta Especialización</span>
          </h1>
          <p className="text-white/75 text-lg leading-relaxed mb-8">
            Formación de alto nivel con los mejores especialistas para impulsar tu carrera profesional.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/cursos"
              className="inline-flex items-center bg-[#084D95] hover:bg-[#23AFE5] text-white font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-105 gap-2 shadow-lg"
            >
              <BookOpen size={18} />
              Ver programas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Slide individual (imagen de fondo + texto + botones) ───────────────────────
function CourseSlide({
  slider,
  hideContent,
  imageFit = "cover",
  compactOverlay,
}: {
  slider: Slider;
  hideContent?: boolean;
  imageFit?: "cover" | "contain";
  /** Función que recibe el slide y devuelve el contenido a mostrar (ej. su propio título) — se muestra SOLO en banners compactos (hideContent) y SOLO si este slide en particular tiene show_content activado. A diferencia del contenido completo de abajo (para el Hero grande del home), este es simple y por-slide. */
  compactOverlay?: (slider: Slider) => React.ReactNode;
}) {
  const hasImage = !!slider.image_url;

  const imageLayer = hasImage ? (
    <img
      src={slider.image_url}
      alt={slider.title}
      draggable={false}
      className={`absolute inset-0 w-full h-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
    />
  ) : (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(135deg, #052E59 0%, #084D95 55%, #23AFE5 100%)" }}
    />
  );

  // Cuando no hay texto/botones propios del slide (ej. banner de catálogo con overlay fijo encima),
  // si el slide tiene destination_url, la imagen completa se vuelve clickeable hacia ahí.
  const isWholeSlideClickable = hideContent && !!slider.destination_url;

  return (
    <div className="relative w-full h-full">
      {/* Imagen del slider — en banners altos (home) cubre de pared a pared; en banners compactos (ej. /cursos) se ve completa sin recortar, con el degradado de marca de fondo */}
      {isWholeSlideClickable ? (
        <Link href={slider.destination_url!} className="absolute inset-0 block" aria-label={slider.title}>
          {imageLayer}
        </Link>
      ) : (
        imageLayer
      )}

      {/* Overlay compacto — ej. "Catálogo de Cursos" en /cursos. Solo si este slide en particular activó show_content. */}
      {hideContent && compactOverlay && slider.show_content && (
        <div className="absolute inset-0 z-10">{compactOverlay(slider)}</div>
      )}

      {/* Content — solo si el slider tiene el contenido de texto activado y no hay un overlay externo (ej. banner de /cursos) reemplazándolo */}
      {!hideContent && slider.show_content && (
        <div className="absolute inset-x-0 bottom-16 md:bottom-20 z-10 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {slider.event_type && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#23AFE5] mb-5 border border-[#23AFE5]/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
                {slider.event_type.name}
              </span>
            )}

            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
              {slider.title}
            </h2>

            {slider.subtitle && (
              <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-8 drop-shadow max-w-md mx-auto">
                {slider.subtitle}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {/* Botón principal — el curso tiene prioridad; si no hay curso configurado, va al asesor comercial; si no hay ninguno, al catálogo general.
                  Usamos !! en vez de ?? porque el backend puede mandar "" (string vacío) en vez de null, y ?? no trata "" como "sin valor". */}
              {slider.destination_url ? (
                <Link
                  href={slider.destination_url}
                  className="inline-flex items-center bg-[#084D95] hover:bg-[#23AFE5] text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 gap-2 shadow-lg shadow-black/30"
                >
                  <BookOpen size={18} />
                  Más Información
                </Link>
              ) : slider.contact_url ? (
                <a
                  href={slider.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-[#084D95] hover:bg-[#23AFE5] text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 gap-2 shadow-lg shadow-black/30"
                >
                  <MessageCircle size={18} />
                  Más Información
                </a>
              ) : (
                <Link
                  href="/cursos"
                  className="inline-flex items-center bg-[#084D95] hover:bg-[#23AFE5] text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 gap-2 shadow-lg shadow-black/30"
                >
                  <BookOpen size={18} />
                  Más Información
                </Link>
              )}

              {/* Botón secundario — también al curso si existe, si no al catálogo general */}
              <Link
                href={slider.destination_url ? slider.destination_url : "/cursos"}
                className="inline-flex items-center border-2 border-white/40 text-white hover:bg-white/10 font-semibold px-6 py-3.5 rounded-xl transition-all backdrop-blur-sm gap-2"
              >
                <BookOpen size={16} />
                {slider.destination_url ? "Ver curso" : "Ver catálogo"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
interface HeroSliderProps {
  /** Contenido por defecto que se muestra SOLO cuando no hay ninguna imagen activa (loading o sin sliders) — ej. el título "Catálogo de Cursos" en /cursos. Nunca se pinta encima de una imagen real, para no chocar con el contenido propio de la imagen. */
  overlay?: React.ReactNode;
  /** Clases de alto — por defecto ocupa casi toda la pantalla (aspect-[16/9]) como en el home; se puede pasar un alto fijo más chico para banners secundarios */
  heightClassName?: string;
  /** Oculta el título/subtítulo/botones propios de cada slide sin necesidad de un overlay (útil en banners compactos donde ese texto grande no entra) */
  hideSlideContent?: boolean;
  /** "cover" (por defecto, home): la imagen llena el banner recortando bordes. "contain": la imagen completa siempre visible, sin recortar — para banners con otra proporción a la del diseño original de la imagen */
  imageFit?: "cover" | "contain";
  /** Si es true, las flechas de navegación están ocultas y solo aparecen al pasar el mouse por encima del slider (útil en banners enmarcados más chicos, ej. /cursos) */
  arrowsOnHover?: boolean;
  /** Tipos de slider a mostrar en este carrusel (ver SliderType). Por defecto muestra todo menos "catalog" (ese tipo es exclusivo del banner de /cursos, se pide explícitamente con este prop). */
  sliderTypes?: Slider["type"][];
  /** Igual que `overlay` pero se evalúa por-slide: cada slide activo lo muestra solo si su propio show_content es true, y recibe el slide para poder usar su propio título (ej. cada banner de catálogo puede tener su propio texto). */
  compactOverlay?: (slider: Slider) => React.ReactNode;
}

export function HeroSlider({
  overlay,
  heightClassName = "aspect-[16/9]",
  hideSlideContent = false,
  imageFit = "cover",
  arrowsOnHover = false,
  sliderTypes,
  compactOverlay,
}: HeroSliderProps = {}) {
  const { data: sliders = [], isLoading } = useQuery({
    queryKey: ["sliders"],
    queryFn: slidersService.list,
  });

  const activeSliders = sliders
    .filter((s) => s.status === "active")
    .filter((s) => (sliderTypes ? sliderTypes.includes(s.type) : s.type !== "catalog"))
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
      <section className={`relative w-full ${heightClassName} animate-pulse bg-brand-dark`}>
        {overlay && <div className="absolute inset-0 z-10">{overlay}</div>}
      </section>
    );
  }

  if (activeSliders.length === 0) {
    // Sin overlay propio (ej. home) usamos el fallback promocional de siempre.
    // Con overlay propio (ej. /cursos) mantenemos el fondo degradado pero con el contenido del banner que lo llama.
    if (!overlay) return <FallbackHero />;
    return (
      <section
        className={`relative w-full ${heightClassName} overflow-hidden`}
        style={{ background: "linear-gradient(135deg, #052E59 0%, #084D95 65%, #23AFE5 100%)" }}
      >
        <div className="absolute inset-0 z-10">{overlay}</div>
      </section>
    );
  }

  const arrowClassName = `absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all flex items-center justify-center text-white border border-white/20 hover:border-white/40 ${
    arrowsOnHover ? "opacity-0 group-hover:opacity-100" : ""
  }`;

  return (
    <section
      className={`relative w-full ${heightClassName} overflow-hidden ${arrowsOnHover ? "group" : ""}`}
      style={{ background: "linear-gradient(135deg, #052E59 0%, #084D95 65%, #23AFE5 100%)" }}
    >
      {/* Slides con transición de opacidad */}
      {activeSliders.map((slider, i) => (
        <div
          key={slider.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
        >
          <CourseSlide
            slider={slider}
            hideContent={hideSlideContent || !!overlay}
            imageFit={imageFit}
            compactOverlay={compactOverlay}
          />
        </div>
      ))}

      {/* Flechas de navegación */}
      {activeSliders.length > 1 && (
        <>
          <button
            onClick={() => handleNav(-1)}
            aria-label="Anterior"
            className={`${arrowClassName} left-4`}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => handleNav(1)}
            aria-label="Siguiente"
            className={`${arrowClassName} right-4`}
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
                  ? "w-8 h-2.5 bg-[#23AFE5]"
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
    </section>
  );
}
