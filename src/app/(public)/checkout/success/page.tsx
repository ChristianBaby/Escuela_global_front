"use client";

<<<<<<< HEAD
import { useState, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { CourseGrid } from "@/components/organisms";
import { CourseFilters, EMPTY_FILTERS } from "@/components/organisms/CourseFilters";
import type { FiltersState } from "@/components/organisms/CourseFilters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cursosService } from "@/lib/services/courses";
import { categoriasService } from "@/lib/services/categories";
import { studentService } from "@/lib/services/student";
import { useAuthStore } from "@/store/authStore";

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "popular", label: "Más populares" },
  { value: "best_rated", label: "Mejor valorados" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

const ITEMS_PER_PAGE = 12;

function filtersToParams(
  filters: FiltersState,
  sort: string,
  search: string,
  page: number,
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.categoria_ids.length > 0) p.set("categorias", filters.categoria_ids.join(","));
  if (filters.min_rating > 0) p.set("rating", String(filters.min_rating));
  if (filters.duration) p.set("duracion", filters.duration);
  if (filters.softwares.length > 0) p.set("softwares", filters.softwares.join(","));
  if (filters.min_price > 0) p.set("precio_min", String(filters.min_price));
  if (filters.max_price > 0) p.set("precio_max", String(filters.max_price));
  if (sort && sort !== "recent") p.set("orden", sort);
  if (search.trim()) p.set("buscar", search.trim());
  if (page > 1) p.set("pagina", String(page));
  return p;
}

function parseFiltersFromUrl(sp: URLSearchParams): {
  filters: FiltersState;
  sort: string;
  search: string;
  page: number;
} {
  return {
    filters: {
      categoria_ids: sp.get("categorias")?.split(",").filter(Boolean) ?? [],
      min_rating: Number(sp.get("rating")) || 0,
      duration: sp.get("duracion") || "",
      softwares: sp.get("softwares")?.split(",").filter(Boolean) ?? [],
      min_price: Number(sp.get("precio_min")) || 0,
      max_price: Number(sp.get("precio_max")) || 0,
    },
    sort: sp.get("orden") || "recent",
    search: sp.get("buscar") || "",
    page: Number(sp.get("pagina")) || 1,
  };
}

function CursosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated } = useAuthStore();
  const [demoEnrollments, setDemoEnrollments] = useState<any[]>([]);

  const { filters, sort, search, page } = parseFiltersFromUrl(searchParams);

  const [searchInput, setSearchInput] = useState(search);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // 🚀 CONSULTA MATRÍCULAS REALES (Refresco frecuente de caché para detectar la compra de inmediato)
  const { data: serverEnrollments = [] } = useQuery({
    queryKey: ["mis-inscripciones"],
    queryFn: studentService.getMyEnrollments,
    enabled: isAuthenticated,
    staleTime: 10_000, // 10 segundos de staleTime para asegurar datos frescos
  });

  // 🚀 CARGA DE MATRÍCULAS DEMO LOCALES
  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem("demo_enrollments");
      if (stored) {
        try {
          setDemoEnrollments(JSON.parse(stored));
        } catch (e) {
          setDemoEnrollments([]);
        }
      }
    } else {
      setDemoEnrollments([]);
    }
  }, [isAuthenticated]);

  const pushUrl = useCallback(
    (f: FiltersState, s: string, q: string, pg: number) => {
      const params = filtersToParams(f, s, q, pg);
      router.push(`/cursos${params.toString() ? `?${params}` : ""}`, { scroll: false });
    },
    [router],
  );

  function handleFiltersChange(f: FiltersState) {
    pushUrl(f, sort, search, 1);
    setMobileOpen(false);
  }

  function handleSortChange(value: string | null) {
    if (!value) return;
    pushUrl(filters, value, search, 1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushUrl(filters, sort, searchInput, 1);
  }

  function handlePageChange(p: number) {
    pushUrl(filters, sort, search, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearSearch() {
    setSearchInput("");
    pushUrl(filters, sort, "", 1);
  }

  const apiParams = {
    status: "published",
    page,
    limit: ITEMS_PER_PAGE,
    sort,
    ...(search.trim() && { search: search.trim() }),
    ...(filters.categoria_ids.length > 0 && { categoria_ids: filters.categoria_ids.join(",") }),
    ...(filters.min_rating > 0 && { min_rating: filters.min_rating }),
    ...(filters.duration && { duration: filters.duration }),
    ...(filters.softwares.length > 0 && { softwares: filters.softwares.join(",") }),
    ...(filters.min_price > 0 && { min_price: filters.min_price }),
    ...(filters.max_price > 0 && { max_price: filters.max_price }),
  };

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["cursos-catalogo", apiParams],
    queryFn: () => cursosService.listCatalog(apiParams),
    staleTime: 30_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.list,
    staleTime: 5 * 60_000,
  });

  const { data: softwares = [] } = useQuery({
    queryKey: ["courses-softwares"],
    queryFn: cursosService.getSoftwares,
    staleTime: 5 * 60_000,
  });

  const allCourses = coursesData?.data ?? [];

  // 🚀 ESCUDO HÍBRIDO ULTRA-ROBUSTO: Extraemos y normalizamos todos los IDs a String()
  const enrolledCourseIds = new Set(
    [
      ...serverEnrollments.map((e: any) => String(e.course_id ?? e.course?.id ?? e.id ?? "")),
      ...demoEnrollments.map((e: any) => String(e.course_id ?? e.course?.id ?? e.id ?? "")),
    ].filter(Boolean)
  );

  // Filtrado estricto comparando String contra String
  const courses = isAuthenticated
    ? allCourses.filter((course: any) => !enrolledCourseIds.has(String(course.id)))
    : allCourses;

  const total = isAuthenticated ? courses.length : (coursesData?.total ?? 0);
  const totalPages = coursesData?.total_pages ?? 1;

  const hasActiveFilters =
    filters.categoria_ids.length > 0 ||
    filters.min_rating > 0 ||
    filters.duration !== "" ||
    filters.softwares.length > 0 ||
    filters.min_price > 0 ||
    filters.max_price > 0 ||
    search.trim().length > 0;

  const activeBadges: { key: string; label: string; onRemove: () => void }[] = [];
  if (search.trim()) {
    activeBadges.push({ key: "search", label: `"${search}"`, onRemove: clearSearch });
  }
  if (filters.min_rating > 0) {
    activeBadges.push({
      key: "rating",
      label: `${filters.min_rating}+ estrellas`,
      onRemove: () => handleFiltersChange({ ...filters, min_rating: 0 }),
    });
  }
  if (filters.duration) {
    const durationLabel = { "<10": "<10h", "10-30": "10-30h", ">30": ">30h" }[filters.duration] ?? filters.duration;
    activeBadges.push({
      key: "duration",
      label: durationLabel,
      onRemove: () => handleFiltersChange({ ...filters, duration: "" }),
    });
  }
  categories.forEach((cat) => {
    if (filters.categoria_ids.includes(cat.id)) {
      activeBadges.push({
        key: `cat-${cat.id}`,
        label: cat.name,
        onRemove: () =>
          handleFiltersChange({
            ...filters,
            categoria_ids: filters.categoria_ids.filter((c) => c !== cat.id),
          }),
      });
    }
  });
  filters.softwares.forEach((sw) => {
    activeBadges.push({
      key: `sw-${sw}`,
      label: sw,
      onRemove: () =>
        handleFiltersChange({
          ...filters,
          softwares: filters.softwares.filter((s) => s !== sw),
        }),
    });
  });
=======
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, BookOpen, ArrowRight, Download, ShieldCheck, FileText, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { ordersService } from "@/lib/services/orders";

function formatPrice(price: number, currency: string) {
  const symbol = currency === "PEN" ? "S/" : "$";
  return `${symbol} ${price.toFixed(2)}`;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <PublicLayout>
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 size={28} className="animate-spin text-[#084D95] mx-auto" />
          </div>
        </PublicLayout>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersService.get(orderId as string),
    enabled: !!orderId,
  });

  const fechaActual = new Date(order?.created_at ?? Date.now()).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!orderId) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <p className="text-gray-500">No se encontró información de la orden.</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#084D95] text-white rounded-lg text-sm font-medium">
            Ir a mi Aula Virtual
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (isLoading || !order) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <Loader2 size={28} className="animate-spin text-[#084D95] mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Cargando comprobante…</p>
        </div>
      </PublicLayout>
    );
  }
>>>>>>> d6f3dd424ae0733704a7215f647c85a1b0fbb2e8

  return (
    <PublicLayout>
      {/* Hero banner */}
      <div className="bg-brand-primary text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold font-heading mb-2">Catálogo de Cursos</h1>
          <p className="text-white/75 text-sm max-w-xl">
            Programas de alta especialización online. Aprende a tu ritmo con docentes expertos.
          </p>

<<<<<<< HEAD
          {/* Barra de búsqueda */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar cursos, docentes, software..."
                className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-secondary border-0"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
=======
      {/* ─── INTERFAZ WEB EN PANTALLA ─── */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center print:hidden">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-6 animate-fadeIn">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-primary tracking-tight">
              ¡Matrícula Completada con Éxito!
            </h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              El pago ha sido procesado de forma segura. Ya tienes acceso inmediato a tu ruta de aprendizaje en Escuela Global.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-gray-100 text-left max-w-md mx-auto space-y-3 text-xs text-gray-600">
            <div className="flex justify-between pb-2 border-b border-gray-200/60 font-semibold text-gray-800">
              <span>Detalle de la Transacción</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={12} /> Homologada ({order.currency})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Estudiante:</span>
              <span className="font-medium text-gray-900">{order.billing_name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">N° de Orden:</span>
              <span className="font-mono font-medium text-gray-900">{order.order_number}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Monto Abonado:</span>
              <span className="font-bold text-gray-900 text-sm">{formatPrice(order.total, order.currency)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-200/60 font-bold text-gray-900 text-sm">
              <span>Estado del Pago:</span>
              <span className="text-emerald-600">{order.payment_status === "paid" ? "PAGADO" : order.payment_status.toUpperCase()}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#084D95] hover:bg-[#084D95]/90 text-white font-medium px-6 py-3 rounded-xl shadow-sm transition-colors text-sm"
            >
              <BookOpen size={16} />
              Ir a mi Aula Virtual
              <ArrowRight size={16} />
            </Link>

>>>>>>> d6f3dd424ae0733704a7215f647c85a1b0fbb2e8
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-secondary text-white text-sm font-medium rounded-lg hover:bg-brand-secondary/90 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

<<<<<<< HEAD
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-16 bg-white rounded-xl border border-gray-200 p-5">
              <CourseFilters
                filters={filters}
                onChange={handleFiltersChange}
                categories={categories}
                softwares={softwares}
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Barra de controles */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                {/* Botón filtros mobile */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <SlidersHorizontal size={15} />
                    Filtros
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                    )}
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <CourseFilters
                        filters={filters}
                        onChange={handleFiltersChange}
                        categories={categories}
                        softwares={softwares}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-gray-500">
                  {coursesLoading ? (
                    <span className="inline-block h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">{total.toLocaleString("es")}</span>{" "}
                      {total === 1 ? "curso" : "cursos"}
                    </>
                  )}
                </p>
              </div>

              {/* Ordenamiento */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-gray-400" />
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48 h-9 text-sm border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-sm">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chips de filtros activos */}
            {activeBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeBadges.map((badge) => (
                  <span
                    key={badge.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full"
                  >
                    {badge.label}
                    <button onClick={badge.onRemove} className="hover:text-brand-primary/60 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    handleFiltersChange(EMPTY_FILTERS);
                    clearSearch();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Grid de cursos */}
            <CourseGrid
              courses={courses}
              loading={coursesLoading}
              skeletonCount={ITEMS_PER_PAGE}
              emptyMessage={
                hasActiveFilters
                  ? "No encontramos cursos con esos filtros. Prueba con otros criterios."
                  : "No hay cursos disponibles en este momento o ya te encuentras matriculado en todos ellos."
              }
            />

            {/* Paginación */}
            {!coursesLoading && totalPages > 1 && (
              <Pagination
                current={page}
                total={totalPages}
                onChange={handlePageChange}
              />
            )}
=======
      {/* ─── COMPROBANTE OFICIAL A4 ─── */}
      <div id="comprobante-factura-a4" className="hidden print:block w-full max-w-4xl mx-auto p-12 text-black bg-white text-left font-sans">
        <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#084D95] font-bold text-2xl tracking-tight">
              <div className="p-1.5 bg-[#084D95] text-white rounded-lg">
                <FileText size={20} />
              </div>
              ESCUELA GLOBAL
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">ESCUELA GLOBAL S.A.C.</p>
            <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">Av. de la Cultura 742, Wanchaq, Cusco, Perú</p>
            <p className="text-[11px] text-gray-400">Contacto: soporte@escuelaglobal.com</p>
          </div>
          <div className="border-2 border-black rounded-xl p-5 text-center min-w-[220px] bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Comprobante de Pago</h2>
            <h1 className="text-sm font-black uppercase my-1 text-[#084D95]">BOLETA DE VENTA</h1>
            <p className="text-xs font-mono font-bold text-gray-900 mt-1">{order.order_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Datos del Adquiriente</h3>
            <p><strong className="text-gray-500">Estudiante:</strong> <span className="text-gray-900 font-semibold">{order.billing_name}</span></p>
            <p><strong className="text-gray-500">Email:</strong> <span className="text-gray-900">{order.billing_email}</span></p>
          </div>
          <div className="space-y-1.5 sm:pl-10">
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Información de Operación</h3>
            <p><strong className="text-gray-500">Fecha de Emisión:</strong> <span className="text-gray-900">{fechaActual}</span></p>
            <p><strong className="text-gray-500">Moneda:</strong> <span className="text-gray-900 font-bold">{order.currency}</span></p>
            <p><strong className="text-gray-500">Condición de Pago:</strong> <span className="text-emerald-700 font-bold">CONTADO (PAGADO)</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-xs text-left mt-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-wider font-bold">
              <th className="p-3 rounded-l-lg">Descripción del Curso / Servicio</th>
              <th className="p-3 text-center w-24">Cantidad</th>
              <th className="p-3 text-right w-32 rounded-r-lg">Valor Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <tr key={idx} className="text-gray-900 font-medium">
                <td className="p-3 py-4">
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="text-[10px] text-gray-400 font-normal mt-0.5">Acceso inmediato y permanente a la ruta LMS</p>
                </td>
                <td className="p-3 py-4 text-center text-gray-600">1</td>
                <td className="p-3 py-4 text-right font-semibold">{formatPrice(item.final_price, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-64 space-y-2 text-xs border-t-2 border-gray-100 pt-4">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Subtotal:</span>
              <span className="tabular-nums text-gray-900">{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2">
              <span>Importe Total:</span>
              <span className="text-[#084D95] tabular-nums">{formatPrice(order.total, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-dashed border-gray-300 pt-6 text-center space-y-4">
          <div className="flex justify-center gap-12 text-[10px] text-gray-500 font-medium">
            <p className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" /> Transacción Homologada
            </p>
            <p>Representación impresa del comprobante digital</p>
>>>>>>> d6f3dd424ae0733704a7215f647c85a1b0fbb2e8
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
<<<<<<< HEAD

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Paginación">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
              p === current
                ? "bg-brand-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export default function CursosPage() {
  return (
    <Suspense
      fallback={
        <PublicLayout>
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">
            Cargando catálogo…
          </div>
        </PublicLayout>
      }
    >
      <CursosContent />
    </Suspense>
  );
}
=======
>>>>>>> d6f3dd424ae0733704a7215f647c85a1b0fbb2e8
