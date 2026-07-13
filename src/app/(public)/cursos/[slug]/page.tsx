"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Play,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Award,
  BarChart3,
  Infinity as InfinityIcon,
  CalendarDays,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { Skeleton } from "@/components/atoms";
import { StarRating } from "@/components/atoms";
import { cursosService } from "@/lib/services/courses";
import { useCartStore } from "@/store/cartStore";
import type { Course, Instructor } from "@/types";
import type { ModuleListItem } from "@/lib/services/courses/courses.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const LEVEL_COLOR: Record<string, string> = {
  principiante: "bg-green-100 text-green-700",
  intermedio: "bg-yellow-100 text-yellow-700",
  avanzado: "bg-red-100 text-red-700",
};

const ACCESS_LABEL: Record<string, string> = {
  "1_year": "1 año de acceso",
  lifetime: "Acceso de por vida",
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── ModuleItem con lazy loading de sesiones ──────────────────────────────────

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
          ? <ChevronUp size={16} className="shrink-0 text-gray-400" />
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
                  <PlayCircle size={14} className="shrink-0 text-[#084D95]" />
                  <span className="flex-1 text-sm text-gray-700">{s.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDuration(s.duration_minutes)}</span>
                </li>
              ))}
        </ul>
      )}
    </div>
  );
}

// ─── AddToCartButton ──────────────────────────────────────────────────────────

function AddToCartButton({
  course,
  variant = "outline",
}: {
  course: Course;
  variant?: "outline" | "solid";
}) {
  const router = useRouter();
  const { addItem, hasItem } = useCartStore();
  const inCart = hasItem(course.id);

  function handleClick() {
    if (inCart) {
      router.push("/carrito");
      return;
    }
    addItem(course);
    toast.success("Curso agregado al carrito", {
      action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
    });
  }

  if (inCart) {
    return (
      <Link
        href="/carrito"
        className="flex items-center justify-center gap-2 w-full bg-[#084D95] hover:bg-[#084D95]/90 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        <CheckCircle2 size={16} />
        Ver carrito
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={
        variant === "solid"
          ? "flex items-center justify-center gap-2 w-full bg-[#23AFE5] hover:bg-[#23AFE5]/90 text-white font-semibold py-3 rounded-xl transition-colors"
          : "flex items-center justify-center gap-2 w-full border-2 border-[#084D95] text-[#084D95] font-semibold py-3 rounded-xl hover:bg-[#084D95]/5 transition-colors"
      }
    >
      <ShoppingCart size={16} />
      Añadir al carrito
    </button>
  );
}

// ─── BuyNowButton ─────────────────────────────────────────────────────────────

function BuyNowButton({ course }: { course: Course }) {
  const router = useRouter();
  const { addItem } = useCartStore();

  function handleClick() {
    addItem(course);
    router.push("/checkout"); // el proxy redirige a login si no está autenticado
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-2 w-full bg-[#084D95] hover:bg-[#084D95]/90 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      <CreditCard size={16} />
      Comprar ahora
    </button>
  );
}

// ─── InstructorCard ───────────────────────────────────────────────────────────

function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4">
      <div className="w-14 h-14 rounded-full bg-[#084D95]/10 flex items-center justify-center shrink-0 overflow-hidden">
        {instructor.photo_url ? (
          <img src={instructor.photo_url} alt={instructor.full_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-[#084D95]">
            {instructor.full_name?.[0]}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{instructor.full_name}</p>
        <p className="text-sm text-[#23AFE5] font-medium">{instructor.title}</p>
        {instructor.description && (
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{instructor.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

interface ReviewPreview {
  user_name: string;
  profile_photo_url?: string;
  rating: number;
  comment: string;
  date: string;
}

function ReviewCard({ review }: { review: ReviewPreview }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#084D95]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {review.profile_photo_url ? (
            <img src={review.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-[#084D95]">
              {review.user_name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-900 text-sm truncate">{review.user_name}</p>
            <p className="text-xs text-gray-400 shrink-0">{formatDate(review.date)}</p>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <PublicLayout>
      <div className="bg-[#084D95] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-40 mb-5 bg-white/10" />
          <Skeleton className="h-9 w-2/3 mb-3 bg-white/10" />
          <Skeleton className="h-5 w-1/2 mb-6 bg-white/10" />
          <Skeleton className="h-4 w-64 bg-white/10" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function CourseNotFound() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-brand-primary mb-2">Curso no encontrado</h1>
        <p className="text-gray-500 mb-6">El curso que buscas no existe o no está disponible.</p>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 bg-[#084D95] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#084D95]/90 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al catálogo
        </Link>
      </div>
    </PublicLayout>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data: course, isLoading, isError } = useQuery({
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

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !course) return <CourseNotFound />;

  const displayPrice   = course.discount_price ?? course.price;
  const hasDiscount    = course.discount_price !== undefined && course.discount_price < course.price;
  const symbol         = course.currency === "PEN" ? "S/" : "$";
  const totalSessions  = modules.reduce((s, m) => s + (m.sessions_count ?? 0), 0);
  const discountPct    = hasDiscount
    ? Math.round(((course.price - displayPrice) / course.price) * 100)
    : 0;

  // ── Sidebar card (reutilizado en hero desktop y content desktop) ────────────
  const SidebarCard = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="h-44 bg-[#084D95]/10 flex items-center justify-center overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={40} className="text-[#084D95]/30" />
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Precio */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl font-bold text-gray-900">
            {symbol} {displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {symbol} {course.price.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-[#23AFE5] ml-auto">
                {discountPct}% dto.
              </span>
            </>
          )}
        </div>

        {/* CTAs */}
        <BuyNowButton course={course} />
        <AddToCartButton course={course} />

        {/* Info */}
        <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400 shrink-0" />
            {formatDuration(course.total_duration_minutes)} de contenido en video
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-gray-400 shrink-0" />
            {totalSessions} clases en {modules.length} módulos
          </div>
          {course.academic_hours > 0 && (
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="text-gray-400 shrink-0" />
              {course.academic_hours} horas académicas
            </div>
          )}
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-gray-400 shrink-0" />
            {LEVEL_LABEL[course.level] ?? course.level}
          </div>
          <div className="flex items-center gap-2">
            {course.access_duration === "lifetime"
              ? <InfinityIcon size={14} className="text-gray-400 shrink-0" />
              : <CalendarDays size={14} className="text-gray-400 shrink-0" />
            }
            {ACCESS_LABEL[course.access_duration] ?? course.access_duration}
          </div>
          <div className="flex items-center gap-2">
            <Award size={14} className="text-gray-400 shrink-0" />
            Certificado al completar
          </div>
        </div>

        {/* Software */}
        {course.software_tools.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Software utilizado
            </p>
            <div className="flex flex-wrap gap-1.5">
              {course.software_tools.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
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
      {/* ── Hero full-width ───────────────────────────────────────────────── */}
      <div className="bg-[#084D95] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="space-y-4">

            {/* Info del curso */}
            <div className="space-y-4">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-white/50">
                <Link href="/cursos" className="hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft size={12} />
                  Cursos
                </Link>
                {course.category && (
                  <>
                    <ChevronRight size={12} />
                    <span className="text-white/50">{course.category.name}</span>
                  </>
                )}
                <ChevronRight size={12} />
                <span className="text-white/70 truncate max-w-xs">{course.title}</span>
              </nav>

              {/* Categoría */}
              {course.category && (
                <span className="inline-block bg-[#23AFE5] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {course.category.name}
                </span>
              )}

              {/* Título y tagline */}
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white">{course.title}</h1>
              <p className="text-white/80 text-base leading-relaxed">{course.tagline}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-yellow-400">{course.avg_rating.toFixed(1)}</span>
                  <StarRating rating={course.avg_rating} size={13} />
                  <span className="text-white/50">({course.review_count.toLocaleString("es")} reseñas)</span>
                </div>
                <span className="flex items-center gap-1.5 text-white/60">
                  <Users size={14} />
                  {course.enrolled_count.toLocaleString("es")} estudiantes
                </span>
                <span className="flex items-center gap-1.5 text-white/60">
                  <Clock size={14} />
                  {formatDuration(course.total_duration_minutes)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLOR[course.level]}`}>
                  {LEVEL_LABEL[course.level]}
                </span>
              </div>

              {/* Instructores */}
              {course.instructors.length > 0 && (
                <p className="text-sm text-white/55">
                  {course.instructors.length === 1 ? "Docente" : "Docentes"}:{" "}
                  {course.instructors.map((inst, idx) => (
                    <span key={inst.id} className="text-[#23AFE5] font-medium">
                      {inst.full_name}{idx < course.instructors.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}

              {/* Precio + botones mobile */}
              <div className="flex items-baseline gap-3 lg:hidden">
                <span className="text-3xl font-bold">{symbol} {displayPrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-lg text-white/50 line-through">{symbol} {course.price.toFixed(2)}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:hidden">
                <BuyNowButton course={course} />
                <AddToCartButton course={course} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Barra sticky mobile ────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">{symbol} {displayPrice.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">{symbol} {course.price.toFixed(2)}</span>
          )}
        </div>
        <AddToCartButton course={course} variant="solid" />
      </div>

      {/* ── Contenido principal + sidebar sticky ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-10">

            {/* Lo que aprenderás */}
            {course.outcomes.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-brand-primary mb-4">Lo que aprenderás</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.outcomes.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-[#084D95] shrink-0 mt-0.5" />
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requisitos */}
            {course.prerequisites.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-brand-primary mb-3">Requisitos previos</h2>
                <ul className="space-y-2">
                  {course.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#084D95] shrink-0 mt-1.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Descripción */}
            {course.description && (
              <section>
                <h2 className="text-lg font-semibold text-brand-primary mb-3">Acerca del curso</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} className="text-[#084D95]" />
                    {formatDuration(course.total_duration_minutes)} de contenido
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={15} className="text-[#084D95]" />
                    {modules.length} módulos · {totalSessions} clases
                  </span>
                  <span className="flex items-center gap-1.5">
                    {course.access_duration === "lifetime"
                      ? <InfinityIcon size={15} className="text-[#084D95]" />
                      : <CalendarDays size={15} className="text-[#084D95]" />
                    }
                    {ACCESS_LABEL[course.access_duration] ?? course.access_duration}
                  </span>
                </div>
              </section>
            )}

            {/* Curriculum */}
            <section>
              <h2 className="text-lg font-semibold text-brand-primary mb-1">Contenido del curso</h2>
              {!modulesLoading && modules.length > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  {modules.length} módulos · {totalSessions} clases · {formatDuration(course.total_duration_minutes)} en total
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
                  El contenido estará disponible próximamente.
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
                <h2 className="text-lg font-semibold text-brand-primary mb-4">
                  {course.instructors.length === 1 ? "Docente" : "Docentes"}
                </h2>
                <div className="space-y-4">
                  {course.instructors.map((inst) => (
                    <InstructorCard key={inst.id} instructor={inst} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar sticky */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              {SidebarCard}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
