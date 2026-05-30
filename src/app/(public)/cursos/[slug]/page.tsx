"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Award,
  BarChart2,
  Infinity,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { StarRating } from "@/components/atoms";
import { cursosService } from "@/lib/services/courses";
import { cartService } from "@/lib/services/cart";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import type { Course, Instructor } from "@/types";

// ─── Extended type for course detail ─────────────────────────────────────────
interface SessionPreview {
  title: string;
  duration_minutes: number;
}

interface ModulePreview {
  title: string;
  sessions_count: number;
  duration_minutes: number;
  sessions: SessionPreview[];
}

interface ReviewPreview {
  user_name: string;
  profile_photo_url?: string;
  rating: number;
  comment: string;
  date: string;
}

interface CourseDetail extends Course {
  modules?: ModulePreview[];
  reviews?: ReviewPreview[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LEVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const ACCESS_LABEL: Record<string, string> = {
  "1_year": "1 año de acceso",
  lifetime: "Acceso de por vida",
};

function formatDuration(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ""}`.trim();
  return `${minutes}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Add to cart button ───────────────────────────────────────────────────────
function AddToCartButton({
  course,
  variant = "outline",
}: {
  course: CourseDetail;
  variant?: "outline" | "solid";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { addItem, hasItem } = useCartStore();

  // Check if already in cart (local or server)
  const { data: serverCart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.get(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const inCartLocally = hasItem(course.id);
  const inCartServer = serverCart?.items.some((i) => i.course.id === course.id) ?? false;
  const inCart = inCartLocally || inCartServer;

  const serverAddMutation = useMutation({
    mutationFn: () => cartService.add(course.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => {},
  });

  function handleClick() {
    // Always add to local store (works for guests too)
    addItem(course as Course);

    // If authenticated, also sync with server
    if (isAuthenticated) {
      serverAddMutation.mutate();
    }

    toast.success("Curso agregado al carrito", {
      action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
    });
  }

  if (inCart) {
    return (
      <Link
        href="/carrito"
        className={
          variant === "solid"
            ? "flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
            : "flex items-center justify-center gap-2 w-full border-2 border-emerald-500 text-emerald-600 font-medium py-3 rounded-xl hover:bg-emerald-50 transition-colors"
        }
      >
        <CheckCircle2 size={16} />
        Ver carrito
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={serverAddMutation.isPending}
      className={
        variant === "solid"
          ? "flex items-center justify-center gap-2 w-full bg-[#3FB1E5] hover:bg-[#3FB1E5]/90 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60"
          : "flex items-center justify-center gap-2 w-full border-2 border-[#2B55A3] text-[#2B55A3] font-medium py-3 rounded-xl hover:bg-[#2B55A3]/5 transition-colors disabled:opacity-60"
      }
    >
      <ShoppingCart size={16} />
      Agregar al carrito
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CursoDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: course, isLoading, isError } = useQuery<CourseDetail>({
    queryKey: ["curso-detail", slug],
    queryFn: () => cursosService.getBySlug(slug) as Promise<CourseDetail>,
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !course) return <CourseNotFound />;

  const displayPrice = course.discount_price ?? course.price;
  const hasDiscount = course.discount_price !== undefined && course.discount_price < course.price;
  const symbol = course.currency === "PEN" ? "S/" : "$";
  const totalModules = course.modules?.length ?? 0;
  const totalSessions = course.modules?.reduce((acc, m) => acc + m.sessions_count, 0) ?? 0;

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <div className="bg-[#1a2f5e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/cursos"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al catálogo
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left — course info */}
            <div className="lg:col-span-2 space-y-4">
              {course.category && (
                <span className="inline-block bg-[#3FB1E5] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {course.category.name}
                </span>
              )}
              <h1 className="text-3xl font-bold font-heading leading-tight">{course.title}</h1>
              <p className="text-white/80 text-base">{course.tagline}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={course.avg_rating} size={14} />
                  <span className="font-semibold">{course.avg_rating.toFixed(1)}</span>
                  <span className="text-white/60">({course.review_count.toLocaleString("es")} reseñas)</span>
                </div>
                <span className="flex items-center gap-1 text-white/70">
                  <Users size={14} />
                  {course.enrolled_count.toLocaleString("es")} estudiantes
                </span>
                <span className="flex items-center gap-1 text-white/70">
                  <BarChart2 size={14} />
                  {LEVEL_LABEL[course.level] ?? course.level}
                </span>
              </div>

              {course.instructors.length > 0 && (
                <p className="text-white/70 text-sm">
                  Docente{course.instructors.length > 1 ? "s" : ""}:{" "}
                  {course.instructors.map((i) => `${i.first_name} ${i.last_name}`).join(", ")}
                </p>
              )}

              {/* Price — mobile only */}
              <div className="flex items-baseline gap-3 lg:hidden">
                <span className="text-3xl font-bold">
                  {symbol} {displayPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-white/50 line-through">
                    {symbol} {course.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Buttons — mobile only */}
              <div className="flex flex-col sm:flex-row gap-3 lg:hidden">
                <BuyNowButton course={course} />
                <AddToCartButton course={course} />
              </div>
            </div>

            {/* Right — sticky sidebar (desktop only hero area) */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-10">
            {/* Outcomes */}
            {course.outcomes.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lo que aprenderás</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.outcomes.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* About the course */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Acerca del curso</h2>
              <div
                className="text-sm text-gray-600 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-[#2B55A3]" />
                  {formatDuration(course.total_duration_minutes)} de contenido
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={15} className="text-[#2B55A3]" />
                  {totalModules} módulos · {totalSessions} sesiones
                </span>
                <span className="flex items-center gap-1.5">
                  {course.access_duration === "lifetime"
                    ? <Infinity size={15} className="text-[#2B55A3]" />
                    : <Calendar size={15} className="text-[#2B55A3]" />
                  }
                  {ACCESS_LABEL[course.access_duration] ?? course.access_duration}
                </span>
              </div>
            </section>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Requisitos previos</h2>
                <ul className="space-y-1.5">
                  {course.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2B55A3] shrink-0 mt-1.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Instructors */}
            {course.instructors.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Docentes</h2>
                <div className="space-y-4">
                  {course.instructors.map((instructor) => (
                    <InstructorCard key={instructor.id} instructor={instructor} />
                  ))}
                </div>
              </section>
            )}

            {/* Syllabus */}
            {course.modules && course.modules.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Contenido del curso</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {totalModules} módulos · {totalSessions} sesiones · {formatDuration(course.total_duration_minutes)} en total
                </p>
                <Syllabus modules={course.modules} />
              </section>
            )}

            {/* Reviews */}
            {course.reviews && course.reviews.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Reseñas de estudiantes</h2>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl font-bold text-gray-900">{course.avg_rating.toFixed(1)}</span>
                  <div>
                    <StarRating rating={course.avg_rating} size={18} />
                    <p className="text-xs text-gray-500 mt-0.5">{course.review_count.toLocaleString("es")} reseñas</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {course.reviews.map((review, i) => (
                    <ReviewCard key={i} review={review} />
                  ))}
                </div>
                {course.review_count > 5 && (
                  <Link
                    href={`/cursos/${course.slug}/resenas`}
                    className="mt-4 inline-block text-sm text-[#2B55A3] hover:underline"
                  >
                    Ver todas las reseñas ({course.review_count}) →
                  </Link>
                )}
              </section>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-16 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Thumbnail */}
              <div className="h-44 bg-[#2B55A3]/10 flex items-center justify-center overflow-hidden">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={40} className="text-[#2B55A3]/30" />
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {symbol} {displayPrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">
                      {symbol} {course.price.toFixed(2)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-sm font-semibold text-emerald-600 ml-auto">
                      {Math.round(((course.price - displayPrice) / course.price) * 100)}% dto.
                    </span>
                  )}
                </div>

                {/* CTA buttons */}
                <BuyNowButton course={course} />
                <AddToCartButton course={course} />

                {/* Quick info */}
                <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span>{formatDuration(course.total_duration_minutes)} de contenido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-gray-400 shrink-0" />
                    <span>{totalModules} módulos · {totalSessions} sesiones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-gray-400 shrink-0" />
                    <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.access_duration === "lifetime"
                      ? <Infinity size={14} className="text-gray-400 shrink-0" />
                      : <Calendar size={14} className="text-gray-400 shrink-0" />
                    }
                    <span>{ACCESS_LABEL[course.access_duration] ?? course.access_duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-gray-400 shrink-0" />
                    <span>Certificado al completar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

// ─── Buy Now Button ───────────────────────────────────────────────────────────
function BuyNowButton({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { addItem } = useCartStore();

  const serverAdd = useMutation({
    mutationFn: () => cartService.add(course.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => {},
  });

  function handleClick() {
    // Add to local cart always
    addItem(course as Course);
    // Sync with server if authenticated
    if (isAuthenticated) serverAdd.mutate();
    // Checkout will enforce login via proxy
    router.push("/checkout");
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-2 w-full bg-[#2B55A3] hover:bg-[#2B55A3]/90 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      <CreditCard size={16} />
      Comprar ahora
    </button>
  );
}

// ─── Syllabus ─────────────────────────────────────────────────────────────────
function Syllabus({ modules }: { modules: ModulePreview[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
      {modules.map((mod, i) => (
        <div key={i}>
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
          >
            <div>
              <p className="font-medium text-gray-900 text-sm">{mod.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {mod.sessions_count} sesión{mod.sessions_count !== 1 ? "es" : ""} · {formatDuration(mod.duration_minutes)}
              </p>
            </div>
            {open.has(i) ? (
              <ChevronUp size={16} className="text-gray-400 shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            )}
          </button>

          {open.has(i) && mod.sessions.length > 0 && (
            <div className="bg-gray-50 divide-y divide-gray-100">
              {mod.sessions.map((session, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3">
                  <PlayCircle size={14} className="text-[#2B55A3] shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{session.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{session.duration_minutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────
function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4">
      <div className="w-14 h-14 rounded-full bg-[#2B55A3]/10 flex items-center justify-center shrink-0 overflow-hidden">
        {instructor.photo_url ? (
          <img src={instructor.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-[#2B55A3]">
            {instructor.first_name[0]}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{instructor.first_name} {instructor.last_name}</p>
        <p className="text-sm text-[#3FB1E5] font-medium">{instructor.title}</p>
        {instructor.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-3">{instructor.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: ReviewPreview }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#2B55A3]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {review.profile_photo_url ? (
            <img src={review.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-[#2B55A3]">
              {review.user_name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-900 text-sm truncate">{review.user_name}</p>
            <p className="text-xs text-gray-400 shrink-0">{formatDate(review.date)}</p>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
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
      <div className="bg-[#1a2f5e] h-64 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl border border-gray-200 h-96 animate-pulse" />
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso no encontrado</h1>
        <p className="text-gray-500 mb-6">El curso que buscas no existe o no está disponible.</p>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 bg-[#2B55A3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2B55A3]/90 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al catálogo
        </Link>
      </div>
    </PublicLayout>
  );
}
