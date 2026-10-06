"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  CalendarDays,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { Skeleton } from "@/components/atoms";
import { StarRating } from "@/components/atoms";
import { CourseCarousel } from "@/components/organisms";
import { cursosService } from "@/lib/services/courses";
import { cartService } from "@/lib/services/cart";
import { studentService } from "@/lib/services/student";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { getGuestSessionToken } from "@/lib/session";
import { isEnrollmentActive } from "@/lib/enrollment";
import type { Course, Instructor, Review } from "@/types";
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

function formatAccessMonths(months: number) {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "año" : "años"} de acceso`;
  }
  return `${months} ${months === 1 ? "mes" : "meses"} de acceso`;
}

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

// ─── EnrolledCourseCTA ────────────────────────────────────────────────────────
// Reemplaza el precio + botones de compra cuando el alumno logueado ya está
// matriculado en este curso (llegó desde el catálogo sin sesión, hizo clic
// por curiosidad, y al iniciar sesión no tiene sentido ofrecerle comprarlo).

function EnrolledCourseCTA({ courseId, progressPercent }: { courseId: string; progressPercent: number }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
        <CheckCircle2 size={16} />
        Ya estás matriculado
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{Math.round(progressPercent)}% completado</p>
      <Link
        href={`/curso/${courseId}`}
        className="flex items-center justify-center gap-2 w-full bg-[#084D95] hover:bg-[#084D95]/90 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        <PlayCircle size={16} />
        {progressPercent > 0 ? "Continuar curso" : "Ir al curso"}
      </Link>
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
  const queryClient = useQueryClient();
  const { addItem, hasItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const inCart = hasItem(course.id);

  async function handleClick() {
    if (inCart) {
      router.push("/carrito");
      return;
    }
    // El espejo local es solo para feedback instantáneo — este botón se
    // convierte en "Ver carrito" en cuanto el curso ya está agregado, así
    // que no se puede duplicar desde acá, y un error de verdad sí vale la
    // pena mostrarlo en vez de quedarse callado.
    addItem(course);
    const sessionToken = isAuthenticated ? undefined : getGuestSessionToken();
    try {
      await cartService.add(course.id, sessionToken);
      toast.success("Curso agregado al carrito", {
        action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo agregar el curso");
    }
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  if (inCart) {
    return (
      <Link
        href="/carrito"
        className={
          variant === "solid"
            ? "flex items-center justify-center gap-2 w-full bg-[#23AFE5] hover:bg-[#23AFE5]/90 text-white font-semibold py-3 rounded-xl transition-colors"
            : "flex items-center justify-center gap-2 w-full border-2 border-[#084D95] text-[#084D95] font-semibold py-3 rounded-xl hover:bg-[#084D95]/5 transition-colors"
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
  const queryClient = useQueryClient();
  const { addItem, hasItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  function handleClick() {
    // El carrito invitado (sin sesión) vive en el store local — el backend exige
    // cookie autenticada para /cart/add, así que esa sincronización es un intento
    // "best effort" (igual que en AddToCartButton), no algo que deba bloquear la
    // compra ni mostrar error: el curso ya quedó agregado localmente.
    // Si el curso ya estaba en el carrito (p. ej. se agregó antes con "Añadir al
    // carrito"), NO se vuelve a llamar /cart/add — el backend no deduplica por
    // curso, así que repetir la llamada crea una fila duplicada en el carrito.
    const alreadyInCart = hasItem(course.id);
    addItem(course);
    if (!alreadyInCart) {
      cartService
        .add(course.id, isAuthenticated ? undefined : getGuestSessionToken())
        .then(() => queryClient.invalidateQueries({ queryKey: ["cart"] }))
        .catch(() => {});
    }
    router.push("/checkout"); // el proxy redirige a login si no está autenticado
  }

  return (
    <button
      onClick={handleClick}
      className="btn-shine flex items-center justify-center gap-2 w-full bg-[#084D95] hover:bg-[#084D95]/90 text-white font-semibold py-3 rounded-xl transition-colors"
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

function ReviewCard({ review }: { review: Review }) {
  const userName = review.user ? `${review.user.first_name} ${review.user.last_name}` : "Estudiante";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#084D95]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {review.user?.profile_photo_url ? (
            <img src={review.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-[#084D95]">
              {userName[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-900 text-sm truncate">{userName}</p>
            <p className="text-xs text-gray-400 shrink-0">{formatDate(review.created_at)}</p>
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
      <div className="bg-[#084D95] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:items-start">
            <div className="lg:col-span-2">
              <Skeleton className="h-4 w-40 mb-5 bg-white/10" />
              <Skeleton className="h-9 w-2/3 mb-3 bg-white/10" />
              <Skeleton className="h-5 w-1/2 mb-6 bg-white/10" />
              <Skeleton className="h-4 w-64 bg-white/10" />
            </div>
            <div className="hidden lg:block">
              <Skeleton className="h-96 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
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
  const { isAuthenticated } = useAuthStore();

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["curso-slug", slug],
    queryFn: () => cursosService.getBySlug(slug),
    staleTime: 2 * 60_000,
  });

  // Misma queryKey que /cursos, /dashboard y /mis-cursos — si el alumno ya
  // está matriculado en ESTE curso (entró desde el catálogo sin login, o ya
  // tenía sesión), no se le ofrece comprarlo de nuevo: se le manda a
  // continuar viéndolo.
  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["mis-inscripciones"],
    queryFn: studentService.getMyEnrollments,
    enabled: isAuthenticated,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["curso-modules", course?.id],
    queryFn: () => cursosService.getModules(course!.id),
    enabled: !!course?.id,
    staleTime: 2 * 60_000,
  });

  // "Cursos relacionados" — mismo criterio de relevancia que en el carrito:
  // misma categoría, software en común, o que esté en descuento.
  // listCatalog() (no list()) — list() pega al endpoint interno /courses,
  // sin filtrar por publicado, y podía sugerir cursos que ni siquiera están
  // disponibles para el público.
  const { data: catalogData, isLoading: loadingRelated } = useQuery({
    queryKey: ["catalog-for-related"],
    queryFn: () => cursosService.listCatalog({ limit: 60, status: "published" }),
    staleTime: 60_000,
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ["curso-reviews", course?.id],
    queryFn: () => cursosService.getReviews(course!.id),
    enabled: !!course?.id,
    staleTime: 60_000,
  });

  // El rectángulo azul decorativo de desktop mide lo mismo que el bloque de
  // texto del hero (en vez de un alto fijo adivinado) — si el texto crece
  // (tagline larga, stats que envuelven a 2 líneas), el azul crece con él y
  // no se corta a la mitad de una línea.
  const heroTextRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = heroTextRef.current;
    if (!el) return;
    const update = () => setHeroHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [course]);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !course) return <CourseNotFound />;

  // isAuthenticated de nuevo aquí (no solo en el "enabled" del useQuery):
  // react-query no borra el resultado anterior solo porque la query se
  // desactive, así que sin este chequeo, cerrar sesión seguía mostrando la
  // matrícula de la cuenta anterior hasta que algo más limpiara el caché.
  // Si el acceso ya venció (access_expires_at pasado), el curso vuelve a
  // comportarse como cualquier otro — se puede volver a comprar — en vez de
  // quedar "matriculado" para siempre.
  const myEnrollment = isAuthenticated
    ? myEnrollments.find((e) => e.course_id === course.id && isEnrollmentActive(e))
    : undefined;

  const displayPricePen = course.discount_price_pen ?? course.price_pen;
  const displayPriceUsd = course.discount_price_usd ?? course.price_usd;
  const hasDiscountPen  = course.discount_price_pen !== undefined && course.discount_price_pen < course.price_pen;
  const hasDiscountUsd  = course.discount_price_usd !== undefined && course.discount_price_usd < course.price_usd;
  const totalSessions   = modules.reduce((s, m) => s + (m.sessions_count ?? 0), 0);
  // Se suma en vivo desde los módulos cargados en vez de confiar en
  // course.total_duration_minutes del backend, que puede quedar desactualizado
  // si se editan sesiones sin recalcular ese campo agregado.
  const totalDurationMinutes = modulesLoading
    ? course.total_duration_minutes
    : modules.reduce((s, m) => s + (m.total_duration ?? 0), 0);
  const discountPct     = hasDiscountPen
    ? Math.round(((course.price_pen - displayPricePen) / course.price_pen) * 100)
    : 0;

  // Relevancia: misma categoría (+3), cada software en común (+1), en descuento (+1) —
  // igual que en /carrito, pero relativo a ESTE curso en vez de a los del carrito.
  const courseSoftware = new Set(course.software_tools ?? []);
  const relatedScore = (candidate: Course): number => {
    let score = 0;
    if (candidate.category_id === course.category_id) score += 3;
    const sharedSoftware = candidate.software_tools?.filter((s) => courseSoftware.has(s)).length ?? 0;
    score += sharedSoftware;
    if (candidate.discount_price_pen !== undefined && candidate.discount_price_pen < candidate.price_pen) score += 1;
    return score;
  };
  const relatedCourses = (catalogData?.data ?? [])
    .filter((c) => c.id !== course.id)
    .sort((a, b) => relatedScore(b) - relatedScore(a))
    .slice(0, 8);

  // ── Sidebar card (reutilizado en hero desktop y content desktop) ────────────
  const SidebarCard = (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="aspect-video bg-[#084D95]/10 flex items-center justify-center overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={40} className="text-[#084D95]/30" />
        )}
      </div>

      <div className="p-5 space-y-4">
        {myEnrollment ? (
          <EnrolledCourseCTA courseId={course.id} progressPercent={myEnrollment.progress_percent} />
        ) : (
          <>
            {/* Precio */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-gray-900">
                  S/ {displayPricePen.toFixed(2)}
                </span>
                {hasDiscountPen && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      S/ {course.price_pen.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-[#23AFE5] ml-auto">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-500">
                  $ {displayPriceUsd.toFixed(2)}
                </span>
                {hasDiscountUsd && (
                  <span className="text-xs text-gray-400 line-through">
                    $ {course.price_usd.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* CTAs */}
            <BuyNowButton course={course} />
            <AddToCartButton course={course} />
          </>
        )}

        {/* Info */}
        <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400 shrink-0" />
            {formatDuration(totalDurationMinutes)} de contenido en video
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
            <CalendarDays size={14} className="text-gray-400 shrink-0" />
            {formatAccessMonths(course.access_duration_months)}
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
      {/* ── Hero + contenido, en un solo grid continuo ──────────────────────
          En desktop el azul es una capa de fondo detrás del bloque de texto,
          medida dinámicamente con un ResizeObserver (heroHeight) — no un alto
          fijo adivinado, porque si el texto crece (tagline larga, stats que
          envuelven a 2 líneas) un número fijo corta la última línea a la mitad.
          La tarjeta, más alta que el texto, sobresale hacia el blanco a propósito.
          En mobile no hay tarjeta al lado (va aparte, hidden lg:block), así que ahí
          el azul simplemente envuelve el bloque de texto con su alto natural.
          La columna de texto+contenido y la tarjeta comparten la MISMA fila del grid,
          así el sticky tiene toda esa altura para seguir pegado durante el scroll. */}
      <div className="relative">
        {/* +32 = el padding-top (lg:pt-8) del contenedor de abajo: el rectángulo y el
            bloque de texto comparten el mismo top-0, pero el texto arranca 32px más
            abajo por ese padding. +24 extra de respiro para que no quede justo al
            límite del texto (se veía la línea de "Docentes" pegada al borde). */}
        <div
          className="hidden lg:block absolute inset-x-0 top-0 bg-[#084D95]"
          style={{ height: heroHeight !== null ? heroHeight + 32 + 24 : 260 }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8 lg:pt-8">
          {/* Sin items-start: la celda de la tarjeta debe estirarse (stretch, el default) a
              todo el alto de la fila para que el sticky de adentro tenga espacio donde pegarse */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">

            {/* Columna izquierda — texto del hero + todo el contenido del curso */}
            <div className="lg:col-span-2 space-y-10">

              {/* Bloque de texto del hero — en mobile lleva su propio fondo azul (alto natural,
                  bordes a bordes vía margen negativo); en desktop es transparente porque el
                  rectángulo de arriba ya pinta el fondo detrás de todo el grid */}
              <div
                ref={heroTextRef}
                className="-mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-6 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 bg-[#084D95] lg:bg-transparent text-white space-y-4"
              >
                {/* Imagen del curso — solo mobile (en desktop ya se ve en la tarjeta de al lado) */}
                <div className="lg:hidden h-48 sm:h-56 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={40} className="text-white/30" />
                  )}
                </div>

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
                    {formatDuration(totalDurationMinutes)}
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
              </div>

              {/* Barra sticky mobile — nombre + precio + compra. Va justo aquí (no al final) para
                  que su posición natural en el documento quede al principio del contenido: así el
                  sticky "atrapa" apenas se sale el hero y se mantiene pegada durante TODO el
                  scroll de "Lo que aprenderás"...Instructores, no solo justo antes del footer.
                  top-14 (no top-0) porque el Header también es sticky top-0 — si ambos usan
                  top-0 quedan superpuestos y el Header (z-50) tapa esta barra (z-20). */}
              <div className="-mx-4 sm:-mx-6 lg:hidden sticky top-14 z-20 bg-white border-b border-gray-200 px-4 py-3 shadow-sm space-y-2">
                {myEnrollment ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900 truncate flex-1">{course.title}</p>
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                        <CheckCircle2 size={13} /> Matriculado
                      </span>
                    </div>
                    <Link
                      href={`/curso/${course.id}`}
                      className="flex items-center justify-center gap-2 w-full bg-[#084D95] hover:bg-[#084D95]/90 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      <PlayCircle size={15} />
                      {myEnrollment.progress_percent > 0 ? "Continuar curso" : "Ir al curso"}
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900 truncate flex-1">{course.title}</p>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-base font-bold text-gray-900">S/ {displayPricePen.toFixed(2)}</span>
                        {hasDiscountPen && (
                          <span className="text-gray-400 line-through text-xs">S/ {course.price_pen.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <BuyNowButton course={course} />
                      <AddToCartButton course={course} />
                    </div>
                  </>
                )}
              </div>

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
                      {formatDuration(totalDurationMinutes)} de contenido
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={15} className="text-[#084D95]" />
                      {modules.length} módulos · {totalSessions} clases
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} className="text-[#084D95]" />
                      {formatAccessMonths(course.access_duration_months)}
                    </span>
                  </div>
                </section>
              )}

              {/* Curriculum */}
              <section>
                <h2 className="text-lg font-semibold text-brand-primary mb-1">Contenido del curso</h2>
                {!modulesLoading && modules.length > 0 && (
                  <p className="text-sm text-gray-500 mb-4">
                    {modules.length} módulos · {totalSessions} clases · {formatDuration(totalDurationMinutes)} en total
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

              {/* Reseñas — solo las aprobadas por el admin (el backend ya filtra) */}
              {(loadingReviews || reviews.length > 0) && (
                <section>
                  <h2 className="text-lg font-semibold text-brand-primary mb-4">
                    Reseñas {course.review_count > 0 && `(${course.review_count})`}
                  </h2>
                  {loadingReviews ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </section>
              )}

            </div>

            {/* Columna derecha — tarjeta de imagen + precio + compra, solo desktop.
                Termina justo con la columna izquierda (hero...Instructores) — "Cursos
                relacionados" queda AFUERA de este grid a propósito, para que el
                contenedor del sticky no se extienda hasta ahí y la tarjeta deje de
                aparecer apenas se llega a esa sección.
                top-24 (no top-6): el Header en desktop trae además la barra de redes
                sociales encima del nav — con top-6 la tarjeta quedaba pegada muy arriba
                y el Header (que va por encima, z-50) le tapaba la parte de arriba de
                la imagen. top-24 deja espacio para las dos filas del Header. */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                {SidebarCard}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Cursos relacionados — fuera del grid de arriba a propósito, para que la
          tarjeta de compra no siga apareciendo una vez que se llega hasta acá.
          Carrusel (mismo que "Cursos más populares" del home) — 4 visibles, deslizable
          si hay más. arrowsTheme="light" porque acá el fondo es blanco, no oscuro. */}
      {(loadingRelated || relatedCourses.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <section>
            <h2 className="text-lg font-semibold text-brand-primary mb-4">Cursos relacionados</h2>
            <CourseCarousel
              courses={relatedCourses}
              loading={loadingRelated}
              skeletonCount={4}
              arrowsTheme="light"
            />
          </section>
        </div>
      )}
    </PublicLayout>
  );
}
