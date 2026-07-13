"use client";

import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { promocionesService } from "@/lib/services/marketing";
import { Tag } from "lucide-react";
import Link from "next/link";
import type { Promotion } from "@/types";

// Gradientes fallback cuando no hay imagen
const FALLBACK_GRADIENTS = [
  "from-[#084D95] to-[#23AFE5]",
  "from-[#7C3AED] to-[#23AFE5]",
  "from-[#059669] to-[#23AFE5]",
  "from-[#DC2626] to-[#F59E0B]",
  "from-[#052E59] to-[#084D95]",
];

function PromoCard({ promo, index }: { promo: Promotion; index: number }) {
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const content = (
    <div className="group relative rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 hover:shadow-xl hover:ring-brand-secondary/40 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Image or gradient background */}
      <div className="relative aspect-square bg-gray-50">
        {promo.image_url ? (
          <img
            src={promo.image_url}
            alt={promo.title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Tag className="text-white/30" size={48} />
          </div>
        )}
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="bg-white px-3 py-3 text-center">
        <p className="font-semibold text-gray-900 text-lg leading-snug line-clamp-1 group-hover:text-[#084D95] transition-colors">
          {promo.title}
        </p>
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
    <div className="rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="bg-white px-3 py-3 flex justify-center">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function PromoBanners() {
  const { data: activePromos = [], isLoading } = useQuery({
    queryKey: ["promociones", "vigentes"],
    queryFn: () => promocionesService.list({ vigente: true }),
  });

  if (!isLoading && activePromos.length === 0) return null;

  return (
    <section className="py-12" style={{ backgroundColor: "#2B55A3" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-9">
          <div>
            <span className="text-white font-bold text-sm uppercase tracking-widest">
              Publicaciones
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-2">
              Descuentos &amp; Novedades
            </h2>
            <div className="w-16 h-1 bg-white rounded-full mt-4" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <PromoCardSkeleton key={i} />)}
          </div>
        ) : activePromos.length > 3 ? (
          <Swiper
            modules={[Autoplay, Navigation]}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            navigation
            loop
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="!pb-2"
          >
            {activePromos.map((promo, i) => (
              <SwiperSlide key={promo.id}>
                <PromoCard promo={promo} index={i} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex flex-wrap justify-center gap-5">
            {activePromos.map((promo, i) => (
              <div key={promo.id} className="w-full sm:w-80">
                <PromoCard promo={promo} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
