"use client";

import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { alianzasService } from "@/lib/services/marketing";

function AllianceCard({ image_url }: { image_url: string }) {
  return (
    <div className="w-32 sm:w-36 aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-white p-4 shadow-sm shrink-0">
      <img
        src={image_url}
        alt=""
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function AllianceCardSkeleton() {
  return (
    <div className="w-32 sm:w-36 aspect-square rounded-2xl bg-gray-200 animate-pulse shrink-0" />
  );
}

export function AlliancesCarousel() {
  const { data: alliances = [], isLoading } = useQuery({
    queryKey: ["alianzas", "vigentes"],
    queryFn: () => alianzasService.list(true),
  });

  if (!isLoading && alliances.length === 0) return null;

  const sorted = [...alliances].sort((a, b) => a.display_order - b.display_order);

  // Con slidesPerView="auto" Swiper necesita bastante más colchón de slides
  // reales para que el loop continuo nunca llegue a su límite y se congele.
  const MIN_SLIDES = 40;
  const loopSlides =
    sorted.length > 0 && sorted.length < MIN_SLIDES
      ? Array.from({ length: Math.ceil(MIN_SLIDES / sorted.length) }, () => sorted).flat()
      : sorted;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-secondary font-bold text-sm uppercase tracking-widest">
            Alianzas Estratégicas
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-brand-primary mt-2">Nuestros Convenios</h2>
          <div className="w-16 h-1 bg-brand-secondary rounded-full mx-auto mt-4" />
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <AllianceCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: false }}
            speed={4000}
            loop
            spaceBetween={24}
            slidesPerView="auto"
            allowTouchMove={false}
            className="!py-1"
          >
            {loopSlides.map((alliance, i) => (
              <SwiperSlide key={`${alliance.id}-${i}`} className="!w-auto flex justify-center">
                <AllianceCard image_url={alliance.image_url} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
