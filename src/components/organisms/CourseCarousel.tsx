"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { CourseCard, CourseCardSkeleton } from "@/components/molecules";
import type { Course } from "@/types";

interface CourseCarouselProps {
  courses: Course[];
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function CourseCarousel({
  courses,
  loading = false,
  skeletonCount = 4,
  emptyMessage = "No se encontraron cursos.",
}: CourseCarouselProps) {
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
    <Swiper
      modules={[Autoplay, Navigation]}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      navigation
      loop={courses.length > 4}
      spaceBetween={20}
      slidesPerView={1}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1280: { slidesPerView: 4 },
      }}
      className="eg-carousel-nav !pb-2"
    >
      {courses.map((course) => (
        <SwiperSlide key={course.id} className="h-auto py-1">
          <CourseCard course={course} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
