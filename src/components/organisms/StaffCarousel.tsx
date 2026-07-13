"use client";

import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { docentesService } from "@/lib/services/marketing";

function StaffSkeleton() {
  return <div className="rounded-2xl bg-gray-200 animate-pulse w-full h-80" />;
}

export function StaffCarousel() {
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["docentes", "vigentes"],
    queryFn: () => docentesService.list(true),
  });

  if (!isLoading && staff.length === 0) return null;

  return (
    <section className="py-16" style={{ backgroundColor: "#2B55A3" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#23AFE5] font-bold text-sm uppercase tracking-widest">
            Nuestros Expertos
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-2">
            Staff de <span className="text-[#23AFE5]">Docentes</span>
          </h2>
          <div className="w-16 h-1 bg-brand-secondary rounded-full mx-auto mt-4" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <StaffSkeleton key={i} />)}
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Navigation]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            navigation
            loop={staff.length > 3}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="!pb-2"
          >
            {staff.map((member) => (
              <SwiperSlide key={member.id}>
                {/* Solo la imagen, tal cual — nombre y cargo ya vienen en la foto */}
                <img
                  src={member.image_url}
                  alt=""
                  className="w-full h-auto rounded-2xl block shadow-xl ring-1 ring-white/10 hover:ring-brand-secondary/50 hover:shadow-2xl transition-all duration-300"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
