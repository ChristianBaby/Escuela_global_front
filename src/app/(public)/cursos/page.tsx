"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { PublicLayout } from "@/components/templates";
import { CourseGrid, HeroSlider } from "@/components/organisms";
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
// 🚀 CAMBIO 1: Importamos el store de autenticación para saber si hay un alumno logueado
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
  
  // 🚀 CAMBIO 2: Extraemos el estado de autenticación
  const { isAuthenticated } = useAuthStore();

  const { filters, sort, search, page } = parseFiltersFromUrl(searchParams);

  const [searchInput, setSearchInput] = useState(search);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // 🚀 CAMBIO 3: Consultamos las matrículas reales de Postgres (Solo si está logueado)
  const { data: serverEnrollments = [] } = useQuery({
    queryKey: ["mis-inscripciones"],
    queryFn: studentService.getMyEnrollments,
    enabled: isAuthenticated,
  });

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

  // Filtramos los cursos que el alumno ya posee, según las matrículas reales del servidor
  const enrolledCourseIds = new Set(serverEnrollments.map((e: any) => e.course_id));

  const courses = isAuthenticated
    ? allCourses.filter((course: any) => !enrolledCourseIds.has(course.id))
    : allCourses;

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
            // 🚀 CORREGIDO: Cambiado de filters.filters a filters solo
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

  function renderCatalogoOverlay(texto: string, subtexto?: string) {
    return (
      <div className="relative h-full">
        {/* Velo de marca sobre la imagen — mismo azul de siempre, para que el título se lea bien encima de cualquier imagen */}
        <div className="absolute inset-0 bg-brand-primary/45" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white drop-shadow-lg">
            {texto}
          </h1>
          {subtexto && (
            <p className="text-white/85 text-sm md:text-base mt-2 drop-shadow max-w-xl">
              {subtexto}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      {/* Hero banner — imágenes propias del banner de catálogo (independientes del slider del home).
          El título "Catálogo de Cursos" se muestra: (a) como respaldo si no hay ninguna imagen activa, y
          (b) sobre cualquier imagen individual cuya ficha en Banner Catálogo tenga activado
          "Mostrar Catálogo de Cursos sobre esta imagen" — las demás imágenes se ven solas, sin texto. */}
      <HeroSlider
        heightClassName="h-[160px] sm:h-[200px] md:h-[240px] lg:h-[260px]"
        imageFit="cover"
        sliderTypes={["catalog"]}
        arrowsOnHover
        overlay={renderCatalogoOverlay("Catálogo de Cursos")}
        compactOverlay={(slider) => renderCatalogoOverlay(slider.title, slider.subtitle ?? undefined)}
      />

      {/* Buscador + filtros (mobile) + orden — sticky debajo del header. Sin el
          contador de cursos, para que ocupe menos alto. En mobile/tablet el
          buscador va en su propia línea y Filtros se agrupa con el orden en
          la línea de abajo; desde lg todo entra en una sola línea. */}
      <div className="sticky top-12 z-30 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full lg:flex-1 lg:max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar cursos, docentes, software..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
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
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-secondary text-white text-sm font-medium rounded-lg hover:bg-brand-secondary/90 transition-colors"
              >
                Buscar
              </button>
            </form>

            <div className="flex items-center gap-3 lg:ml-auto">
              {/* Botón filtros mobile/tablet — agrupado con el orden, al costado opuesto del buscador */}
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
                  <div className="mt-4 px-4 pb-6">
                    <CourseFilters
                      filters={filters}
                      onChange={handleFiltersChange}
                      categories={categories}
                      softwares={softwares}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Ordenamiento */}
              <div className="flex items-center gap-2 ml-auto lg:ml-0">
                <ArrowUpDown size={14} className="text-gray-400" />
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-40 sm:w-48 h-9 text-sm border-gray-300">
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar desktop — sticky, con el mismo offset que la barra de arriba
              (header + buscador/controles) para que no se tapen */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-[118px] bg-white rounded-xl border border-gray-200 p-5">
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
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

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