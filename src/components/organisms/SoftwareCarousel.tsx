"use client";

import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Link from "next/link";
import { softwaresService } from "@/lib/services/marketing";

function SoftwareCard({ name, image_url }: { name: string; image_url: string }) {
  return (
    <Link
      href={`/cursos?softwares=${encodeURIComponent(name)}`}
      className="group flex flex-col items-center gap-3 w-32 sm:w-36 shrink-0"
    >
      <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-white p-4 shadow-sm group-hover:shadow-md group-hover:border-brand-secondary/50 transition-all duration-300">
        <img
          src={image_url}
          alt={name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <span className="text-sm font-medium text-gray-700 text-center group-hover:text-brand-primary transition-colors line-clamp-1">
        {name}
      </span>
    </Link>
  );
}

function SoftwareCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 w-32 sm:w-36 shrink-0">
      <div className="w-full aspect-square rounded-2xl bg-gray-200 animate-pulse" />
      <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

export function SoftwareCarousel() {
  const { data: softwares = [], isLoading } = useQuery({
    queryKey: ["softwares", "vigentes"],
    queryFn: () => softwaresService.list(true),
  });

  if (!isLoading && softwares.length === 0) return null;

  const sorted = [...softwares].sort((a, b) => a.display_order - b.display_order);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-secondary font-bold text-sm uppercase tracking-widest">
            Herramientas
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-primary mt-2">Domina los siguientes softwares</h2>
          <div className="w-16 h-1 bg-brand-secondary rounded-full mx-auto mt-4" />
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <SoftwareCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: false }}
            speed={4000}
            loop
            spaceBetween={24}
            slidesPerView={3}
            allowTouchMove={false}
            breakpoints={{
              480: { slidesPerView: 4 },
              640: { slidesPerView: 5 },
              1024: { slidesPerView: 7 },
            }}
            className="!py-1"
          >
            {sorted.map((sw) => (
              <SwiperSlide key={sw.id} className="!w-auto flex justify-center">
                <SoftwareCard name={sw.name} image_url={sw.image_url} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
