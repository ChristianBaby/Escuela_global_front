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
    <div className="group rounded-2xl overflow-hidden border border-gray-200 bg-white h-full hover:shadow-lg hover:border-brand-secondary/40 hover:-translate-y-0.5 transition-all duration-300">
      {launch.image_url && (
        <div className="relative w-full">
          <img
            src={launch.image_url}
            alt={launch.title}
            className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            En Vivo
          </span>
        </div>
      )}

      <div className="p-3">
        <h3 className="text-brand-primary font-bold text-base leading-snug mt-1 mb-2 line-clamp-2">
          {launch.title}
        </h3>
        <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <Calendar size={14} />
          Fecha de Inicio: {new Date(launch.start_date).toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
        </p>

        {launch.link_url ? (
          <a
            href={launch.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 w-full bg-brand-primary text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-brand-primary/90 transition-colors"
          >
            Más Información <ChevronRight size={16} />
          </a>
        ) : (
          <span className="flex items-center justify-center gap-1 w-full bg-brand-primary text-white font-semibold text-sm py-2.5 rounded-xl opacity-90 cursor-default">
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
      <div className="h-72 bg-gray-200" />
      <div className="p-3 space-y-2">
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
        <div className="text-center mb-12">
          <span className="text-[#23AFE5] font-bold text-sm uppercase tracking-widest">
            Lo Más Reciente
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-primary mt-2">Top Nuevos Lanzamientos</h2>
          <div className="w-16 h-1 bg-brand-secondary rounded-full mx-auto mt-4" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => <LaunchCardSkeleton key={i} />)}
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
              1024: { slidesPerView: 2 },
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
          <div className="flex flex-wrap justify-center gap-6">
            {launches.map((launch) => (
              <div key={launch.id} className="w-full sm:w-[420px]">
                <LaunchCard launch={launch} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
