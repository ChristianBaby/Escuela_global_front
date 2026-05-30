"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/templates";
import { Skeleton } from "@/components/atoms";
import { StarRating } from "@/components/atoms";
import { cursosService } from "@/lib/services/courses";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import {
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  BookOpen,
  Award,
  ShoppingCart,
  ChevronRight,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import type { ModuleListItem } from "@/lib/services/courses/courses.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const LEVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const LEVEL_COLOR: Record<string, string> = {
  principiante: "bg-green-100 text-green-700",
  intermedio:   "bg-yellow-100 text-yellow-700",
  avanzado:     "bg-red-100 text-red-700",
};

// ─── ModuleItem (acordeón lazy) ────────────────────────────────────────────────

function ModuleItem({ module }: { module: ModuleListItem }) {
  const [open, setOpen] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["module-sessions", module.id],
    queryFn: () => cursosService.getSessions(module.id),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {open
          ? <ChevronUp  size={16} className="shrink-0 text-gray-400" />
          : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
        <span className="flex-1 text-sm font-semibold text-gray-900">{module.title}</span>
        <span className="text-xs text-gray-500 shrink-0">
          {module.sessions_count} {module.sessions_count === 1 ? "clase" : "clases"} · {formatDuration(module.total_duration)}
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-gray-100">
          {isLoading
            ? Array.from({ length: module.sessions_count }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-10" />
                </li>
              ))
            : sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <Play size={14} className="shrink-0 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700">{s.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDuration(s.duration_minutes)}</span>
                </li>
              ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem, hasItem } = useCartStore();

  const { data: course, isLoading } = useQuery({
    queryKey: ["curso-slug", slug],
    queryFn: () => cursosService.getBySlug(slug),
    staleTime: 2 * 60_000,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["curso-modules", course?.id],
    queryFn: () => cursosService.getModules(course!.id),
    enabled: !!course?.id,
    staleTime: 2 * 60_000,
  });

  const inCart          = course ? hasItem(course.id) : false;
  const currencySymbol  = course?.currency === "PEN" ? "S/" : "$";
  const displayPrice    = course?.discount_price ?? course?.price ?? 0;
  const totalSessions   = modules.reduce((s, m) => s + (m.sessions_count ?? 0), 0);

  function handleAddToCart() {
    if (!course) return;
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    addItem(course);
    if (!inCart) router.push("/carrito");
    else router.push("/carrito");
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="bg-[#1c2536] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-4 w-40 mb-5 bg-white/10" />
            <Skeleton className="h-9 w-2/3 mb-3 bg-white/10" />
            <Skeleton className="h-5 w-1/2 mb-6 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5" />)}
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!course) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Curso no encontrado</h2>
          <p className="text-gray-500 mb-6">El curso que buscas no existe o fue eliminado.</p>
          <Link href="/cursos" className="text-[#2B55A3] hover:underline font-medium">
            ← Volver al catálogo
          </Link>
        </div>
      </PublicLayout>
    );
  }

  // ── BuyCard component (reutilizado en desktop y mobile) ────────────────────
  const BuyCard = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-[#2B55A3] to-[#3FB1E5] flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-white/40" />
        </div>
      )}

      <div className="p-5">
        {/* Precio */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-gray-900">
            {currencySymbol} {displayPrice.toFixed(2)}
          </span>
          {course.discount_price && (
            <span className="text-gray-400 line-through text-lg">
              {currencySymbol} {course.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleAddToCart}
          className="w-full py-3 px-4 rounded-lg font-semibold text-sm bg-[#2B55A3] text-white hover:bg-[#2B55A3]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-2"
        >
          <ShoppingCart size={16} />
          {inCart ? "Ir al carrito" : "Añadir al carrito"}
        </button>

        {/* Features */}
        <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
          <li className="flex items-center gap-2.5">
            <Clock size={15} className="text-gray-400 shrink-0" />
            {formatDuration(course.total_duration_minutes)} de contenido en video
          </li>
          <li className="flex items-center gap-2.5">
            <BookOpen size={15} className="text-gray-400 shrink-0" />
            {totalSessions} clases en {modules.length} módulos
          </li>
          <li className="flex items-center gap-2.5">
            <Award size={15} className="text-gray-400 shrink-0" />
            Certificado al completar
          </li>
          <li className="flex items-center gap-2.5">
            <CalendarDays size={15} className="text-gray-400 shrink-0" />
            {course.access_duration === "lifetime" ? "Acceso de por vida" : "Acceso por 1 año"}
          </li>
        </ul>

        {/* Software tools */}
        {course.software_tools.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Software utilizado
            </p>
            <div className="flex flex-wrap gap-1.5">
              {course.software_tools.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#1c2536] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="lg:grid lg:grid-cols-3 lg:gap-12">

            {/* Info del curso */}
            <div className="lg:col-span-2 space-y-4">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-white/50">
                <Link href="/cursos" className="hover:text-white transition-colors">Cursos</Link>
                <ChevronRight size={12} />
                {course.category && (
                  <>
                    <span className="text-white/50">{course.category.name}</span>
                    <ChevronRight size={12} />
                  </>
                )}
                <span className="text-white/70 truncate max-w-xs">{course.title}</span>
              </nav>

              {/* Categoría */}
              {course.category && (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3FB1E5]/20 text-[#3FB1E5] border border-[#3FB1E5]/30">
                  {course.category.name}
                </span>
              )}

              {/* Título y tagline */}
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {course.title}
              </h1>
              <p className="text-white/75 text-base leading-relaxed">{course.tagline}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-yellow-400">{course.avg_rating.toFixed(1)}</span>
                  <StarRating rating={course.avg_rating} size={13} />
                  <span className="text-white/50">
                    ({course.review_count.toLocaleString("es")} reseñas)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Users size={14} />
                  {course.enrolled_count.toLocaleString("es")} estudiantes
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Clock size={14} />
                  {formatDuration(course.total_duration_minutes)}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLOR[course.level]}`}>
                  <span className="flex items-center gap-1">
                    <BarChart3 size={11} />
                    {LEVEL_LABEL[course.level]}
                  </span>
                </span>
              </div>

              {/* Instructores */}
              {course.instructors.length > 0 && (
                <p className="text-sm text-white/55">
                  Instructores:{" "}
                  {course.instructors.map((inst, idx) => (
                    <span key={inst.id} className="text-[#3FB1E5] font-medium">
                      {inst.full_name}
                      {idx < course.instructors.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* BuyCard en hero (desktop) */}
            <div className="hidden lg:block mt-2">
              {BuyCard}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra sticky mobile ────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            {currencySymbol} {displayPrice.toFixed(2)}
          </span>
          {course.discount_price && (
            <span className="text-gray-400 line-through text-sm">
              {currencySymbol} {course.price.toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="py-2.5 px-5 rounded-lg font-semibold text-sm bg-[#2B55A3] text-white hover:bg-[#2B55A3]/90 transition-colors flex items-center gap-2"
        >
          <ShoppingCart size={15} />
          {inCart ? "Ver carrito" : "Añadir"}
        </button>
      </div>

      {/* ── Contenido principal ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">

          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-12">

            {/* Lo que aprenderás */}
            {course.outcomes.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Lo que aprenderás</h2>
                <div className="border border-gray-200 rounded-xl p-6 grid sm:grid-cols-2 gap-3">
                  {course.outcomes.map((outcome, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="shrink-0 text-[#2B55A3] mt-0.5" />
                      <span className="text-sm text-gray-700">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requisitos */}
            {course.prerequisites.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requisitos</h2>
                <ul className="space-y-2.5">
                  {course.prerequisites.map((prereq, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2B55A3] shrink-0 mt-1.5" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Descripción */}
            {course.description && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del curso</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </section>
            )}

            {/* Curriculum */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Contenido del curso</h2>
              {!modulesLoading && modules.length > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  {modules.length} módulos · {totalSessions} clases ·{" "}
                  {formatDuration(course.total_duration_minutes)} en total
                </p>
              )}
              {modulesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : modules.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">
                  El contenido del curso estará disponible próximamente.
                </p>
              ) : (
                <div className="space-y-2">
                  {modules.map((m) => (
                    <ModuleItem key={m.id} module={m} />
                  ))}
                </div>
              )}
            </section>

            {/* Instructores */}
            {course.instructors.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  {course.instructors.length === 1 ? "Instructor" : "Instructores"}
                </h2>
                <div className="space-y-8">
                  {course.instructors.map((inst) => (
                    <div key={inst.id} className="flex gap-5">
                      {inst.photo_url ? (
                        <img
                          src={inst.photo_url}
                          alt={inst.full_name}
                          className="w-16 h-16 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#2B55A3] flex items-center justify-center text-white text-xl font-bold shrink-0">
                          {inst.full_name?.[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">
                          {inst.full_name}
                        </h3>
                        <p className="text-sm text-[#2B55A3] mb-2">{inst.title}</p>
                        {inst.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {inst.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Columna derecha — BuyCard sticky (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              {BuyCard}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
