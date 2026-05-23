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
  const displayPrice = course.discount_price ?? course.price;
  const hasDiscount = course.discount_price !== undefined && course.discount_price < course.price;
  const currencySymbol = course.currency === "PEN" ? "S/" : "$";

  return (
    <Link href={`/cursos/${course.slug}`} className="group block h-full">
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-brand-secondary/50 transition-all duration-200 h-full flex flex-col">
        <div className="relative w-full h-48 bg-gradient-to-br from-brand-primary to-brand-secondary flex-shrink-0">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
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
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-brand-primary transition-colors">
            {course.title}
          </h3>

          {course.instructors?.[0] && (
            <p className="text-xs text-gray-500 truncate">{course.instructors[0].first_name} {course.instructors[0].last_name}</p>
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

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-brand-primary text-base">
                {currencySymbol} {displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {currencySymbol} {course.price.toFixed(2)}
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
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
