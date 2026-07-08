"use client";

import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Calendar, ChevronRight } from "lucide-react";
import { lanzamientosService } from "@/lib/services/marketing";
import type { UpcomingLaunch } from "@/types";

function LaunchCard({ launch }: { launch: UpcomingLaunch }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white h-full">
      {/* Imagen tal cual, sin efectos */}
      {launch.image_url && (
        <img src={launch.image_url} alt={launch.title} className="w-full h-auto block" />
      )}

      <div className="p-4">
        <span className="text-[#3FB1E5] font-bold text-[11px] uppercase tracking-widest">
          {launch.category_label}
        </span>
        <h3 className="text-gray-900 font-bold text-base leading-snug mt-1 mb-3">
          {launch.title}
        </h3>
        <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
          <Calendar size={14} />
          Fecha de Inicio: {new Date(launch.start_date).toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
        </p>

        {launch.link_url ? (
          <a
            href={launch.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 w-full border-2 border-[#0f1f4d] text-[#0f1f4d] font-semibold text-sm py-2.5 rounded-xl hover:bg-[#0f1f4d] hover:text-white transition-colors"
          >
            Más Información <ChevronRight size={16} />
          </a>
        ) : (
          <span className="flex items-center justify-center gap-1 w-full border-2 border-gray-200 text-gray-400 font-semibold text-sm py-2.5 rounded-xl">
            Más Información <ChevronRight size={16} />
          </span>
        )}
      </div>
    </div>
  );
}

function LaunchCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-8 bg-gray-100 rounded w-full mt-3" />
      </div>
    </div>
  );
}

export function UpcomingLaunches() {
  const { data: launches = [], isLoading } = useQuery({
    queryKey: ["lanzamientos", "vigentes"],
    queryFn: () => lanzamientosService.list(true),
  });

  if (!isLoading && launches.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[#3FB1E5] font-bold text-xs uppercase tracking-widest">
            Lo Más Reciente
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">Top Nuevos Lanzamientos</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <LaunchCardSkeleton key={i} />)}
          </div>
        ) : launches.length > 3 ? (
          <Swiper
            modules={[Autoplay, Navigation]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
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
            {launches.map((launch) => (
              <SwiperSlide key={launch.id} className="h-auto">
                <LaunchCard launch={launch} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {launches.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
