import { CourseCard, CourseCardSkeleton } from "@/components/molecules";
import type { Course } from "@/types";

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function CourseGrid({
  courses,
  loading = false,
  skeletonCount = 8,
  emptyMessage = "No se encontraron cursos.",
}: CourseGridProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
