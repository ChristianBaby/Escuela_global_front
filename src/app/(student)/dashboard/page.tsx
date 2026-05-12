"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { BookOpen, Clock, Award, ChevronRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { Enrollment } from "@/types";

function useMyEnrollments() {
  return useQuery({
    queryKey: ["mis-inscripciones"],
    queryFn: () => api.get<Enrollment[]>("/estudiantes/mis-inscripciones").then((r) => r.data),
  });
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  const firstName = user?.full_name?.split(" ")[0] ?? "Estudiante";
  const cursosActivos  = enrollments.filter((e) => !e.completed_at).length;
  const completados    = enrollments.filter((e) => e.completed_at).length;
  const progresoPromedio = enrollments.length
    ? Math.round(enrollments.reduce((acc, e) => acc + e.progress_percent, 0) / enrollments.length)
    : 0;

  // Curso más reciente para "continuar aprendiendo"
  const cursoReciente = enrollments.find((e) => !e.completed_at && e.last_accessed_at) ?? enrollments[0];

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, {firstName} 👋</h1>
        <p className="text-gray-500 mt-1">Aquí tienes un resumen de tu aprendizaje</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen size={20} className="text-[#2B55A3]" />}
          label="Cursos activos"
          value={isLoading ? "—" : cursosActivos}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-[#3FB1E5]" />}
          label="Progreso promedio"
          value={isLoading ? "—" : `${progresoPromedio}%`}
          bg="bg-cyan-50"
        />
        <StatCard
          icon={<Award size={20} className="text-emerald-600" />}
          label="Completados"
          value={isLoading ? "—" : completados}
          bg="bg-emerald-50"
        />
      </div>

      {/* Continuar aprendiendo */}
      {cursoReciente && cursoReciente.course && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Continuar aprendiendo</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
            <div className="w-20 h-14 rounded-lg bg-[#2B55A3]/10 flex items-center justify-center shrink-0 overflow-hidden">
              {cursoReciente.course.thumbnail_url
                ? <img src={cursoReciente.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                : <BookOpen size={24} className="text-[#2B55A3]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{cursoReciente.course.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-xs">
                  <div
                    className="h-1.5 bg-[#2B55A3] rounded-full transition-all"
                    style={{ width: `${cursoReciente.progress_percent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 shrink-0">{cursoReciente.progress_percent}%</span>
              </div>
            </div>
            <Link
              href={`/curso/${cursoReciente.course_id}`}
              className="flex items-center gap-2 bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors shrink-0"
            >
              <PlayCircle size={16} />
              Continuar
            </Link>
          </div>
        </section>
      )}

      {/* Mis cursos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Mis cursos</h2>
          <Link href="/mis-cursos" className="text-sm text-[#2B55A3] hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No estás inscrito en ningún curso</p>
            <p className="text-gray-400 text-sm mt-1">Explora el catálogo y empieza a aprender</p>
            <Link
              href="/cursos"
              className="inline-block mt-4 bg-[#2B55A3] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
            >
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 6).map((enrollment) => (
              <CourseCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function CourseCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course;
  if (!course) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-28 bg-[#2B55A3]/10 flex items-center justify-center overflow-hidden">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <BookOpen size={32} className="text-[#2B55A3]/40" />
        }
      </div>
      <div className="p-4">
        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{course.title}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-[#2B55A3] rounded-full"
              style={{ width: `${enrollment.progress_percent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{enrollment.progress_percent}%</span>
        </div>
        <Link
          href={`/curso/${enrollment.course_id}`}
          className="mt-3 block text-center text-sm font-medium text-[#2B55A3] border border-[#2B55A3] rounded-lg py-1.5 hover:bg-[#2B55A3] hover:text-white transition-colors"
        >
          {enrollment.completed_at ? "Revisar" : "Continuar"}
        </Link>
      </div>
    </div>
  );
}
