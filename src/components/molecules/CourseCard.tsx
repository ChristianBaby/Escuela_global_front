import Link from "next/link";
import { Badge, Skeleton } from "@/components/atoms";
import { StarRating } from "@/components/atoms";
import { BookOpen, Clock, Users } from "lucide-react";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
}

const levelLabel: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export function CourseCard({ course }: CourseCardProps) {
  const displayPricePen = course.discount_price_pen ?? course.price_pen;
  const displayPriceUsd = course.discount_price_usd ?? course.price_usd;
  const hasDiscountPen = course.discount_price_pen !== undefined && course.discount_price_pen < course.price_pen;
  const hasDiscountUsd = course.discount_price_usd !== undefined && course.discount_price_usd < course.price_usd;
  const discountPct = hasDiscountPen
    ? Math.round((1 - course.discount_price_pen! / course.price_pen) * 100)
    : 0;

  return (
    <Link href={`/cursos/${course.slug}`} className="group block h-full">
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-brand-secondary/50 hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
        <div className="relative w-full h-48 bg-gradient-to-br from-brand-primary to-brand-secondary flex-shrink-0 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/40" />
            </div>
          )}
          {course.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-brand-secondary text-white border-0 text-xs font-medium">
                {course.category.name}
              </Badge>
            </div>
          )}
          {discountPct > 0 && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-500 text-white border-0 text-xs font-bold">
                -{discountPct}%
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-brand-primary line-clamp-2 text-sm leading-snug group-hover:text-brand-primary transition-colors">
            {course.title}
          </h3>

          {course.instructors?.[0] && (
            <p className="text-xs text-gray-500 truncate">{course.instructors[0].full_name}</p>
          )}

          <div className="flex items-center gap-2">
            <StarRating rating={course.avg_rating} size={12} />
            <span className="text-xs text-gray-500 tabular-nums">({course.review_count})</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {course.total_duration_minutes >= 60
                ? `${Math.floor(course.total_duration_minutes / 60)}h ${course.total_duration_minutes % 60}m`
                : `${course.total_duration_minutes}m`}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {course.enrolled_count.toLocaleString("es")}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-brand-primary text-base">
                  S/ {displayPricePen.toFixed(2)}
                </span>
                {hasDiscountPen && (
                  <span className="text-xs text-gray-400 line-through">
                    S/ {course.price_pen.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-gray-500">
                  $ {displayPriceUsd.toFixed(2)}
                </span>
                {hasDiscountUsd && (
                  <span className="text-[10px] text-gray-400 line-through">
                    $ {course.price_usd.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500 shrink-0">
              {levelLabel[course.level] ?? course.level}
            </Badge>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}
