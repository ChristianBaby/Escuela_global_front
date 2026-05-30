"use client";

import { useQuery } from "@tanstack/react-query";
import { promocionesService } from "@/lib/services/marketing";
import { ExternalLink, Tag } from "lucide-react";
import Link from "next/link";
import type { Promotion } from "@/types";

// Gradientes fallback cuando no hay imagen
const FALLBACK_GRADIENTS = [
  "from-[#2B55A3] to-[#3FB1E5]",
  "from-[#7C3AED] to-[#3FB1E5]",
  "from-[#059669] to-[#3FB1E5]",
  "from-[#DC2626] to-[#F59E0B]",
  "from-[#0f1f4d] to-[#2B55A3]",
];

function PromoCard({ promo, index }: { promo: Promotion; index: number }) {
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const content = (
    <div className="group relative flex-shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Image or gradient background */}
      <div className="relative h-44">
        {promo.image_url ? (
          <img
            src={promo.image_url}
            alt={promo.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Tag className="text-white/30" size={48} />
          </div>
        )}
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Status badge */}
        {promo.status === "active" && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Activa
          </span>
        )}

        {/* Expiry badge */}
        {promo.ends_at && new Date(promo.ends_at) > new Date() && (
          <span className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
            Hasta {new Date(promo.ends_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="bg-white p-4">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#2B55A3] transition-colors">
          {promo.title}
        </p>
        {promo.destination_url && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <ExternalLink size={10} />
            Ver oferta
          </p>
        )}
      </div>
    </div>
  );

  if (promo.destination_url) {
    return (
      <Link href={promo.destination_url} target="_blank" rel="noopener noreferrer">
        {content}
      </Link>
    );
  }
  return content;
}

function PromoCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="bg-white p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function PromoBanners() {
  const { data: promociones = [], isLoading } = useQuery({
    queryKey: ["promociones"],
    queryFn: promocionesService.list,
  });

  const activePromos = promociones.filter((p) => p.status === "active");

  if (!isLoading && activePromos.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <span className="text-[#3FB1E5] font-bold text-xs uppercase tracking-widest">
              Publicaciones
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              Descuentos &amp; Novedades
            </h2>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div className="relative">
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-1">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <PromoCardSkeleton key={i} />)
              : activePromos.map((promo, i) => (
                  <div key={promo.id} className="snap-start">
                    <PromoCard promo={promo} index={i} />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
