"use client";

import { useState, useCallback, useRef, useLayoutEffect, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
import { isEnrollmentActive } from "@/lib/enrollment";
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

  // Sincroniza el input con la URL (atrás/adelante, limpiar filtros) sin pisar lo que
  // se está escribiendo: "deep " (con espacio al final) ya corresponde a ?buscar=deep
  useEffect(() => {
    setSearchInput((prev) => (prev.trim() === search ? prev : search));
  }, [search]);

  // Offsets medidos en vivo (no adivinados) para que el buscador/filtros/orden y
  // el sidebar de filtros queden justo debajo del Header y de la barra de arriba,
  // sin importar cuánto mida el Header — ya cambió de tamaño varias veces (barra
  // de redes sociales agregada después) y romper esto a mano cada vez no escala.
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [toolbarHeight, setToolbarHeight] = useState(60);

  // Medidos por separado (no en un solo efecto que dependía de que AMBOS refs
  // existieran a la vez) — así uno no puede bloquear silenciosamente al otro.
  // useLayoutEffect (no useEffect) para medir antes del primer pintado.
  useLayoutEffect(() => {
    const headerEl = document.querySelector("header");
    if (!headerEl) return;
    const update = () => setHeaderHeight(headerEl.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerEl);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const toolbarEl = toolbarRef.current;
    if (!toolbarEl) return;
    const update = () => setToolbarHeight(toolbarEl.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(toolbarEl);
    return () => ro.disconnect();
  }, []);

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

  // Búsqueda en vivo: 350 ms después de dejar de escribir se actualizan los cursos,
  // sin esperar Enter. replace (no push) para no llenar el historial con cada letra.
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = setTimeout(() => {
      const params = filtersToParams(filters, sort, searchInput, 1);
      router.replace(`/cursos${params.toString() ? `?${params}` : ""}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona a lo que se escribe
  }, [searchInput]);

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
    // Mientras llegan los resultados de la nueva búsqueda se mantienen los anteriores
    // (las tarjetas cambian directo, sin parpadear con el esqueleto de carga)
    placeholderData: keepPreviousData,
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

  const courses = coursesData?.data ?? [];

  // Los cursos en los que el alumno ya está matriculado NO se esconden del
  // catálogo — se muestran igual, pero con su progreso y "Ver curso" /
  // "Continuar curso" en vez del precio (CourseCard se encarga con esto).
  // Si el acceso ya venció, se excluye: el curso vuelve a comportarse como
  // cualquier otro (se puede volver a comprar) en vez de quedar "matriculado"
  // para siempre.
  const enrollmentProgress: Record<string, number> | undefined = isAuthenticated
    ? Object.fromEntries(
        serverEnrollments.filter(isEnrollmentActive).map((e) => [e.course_id, e.progress_percent])
      )
    : undefined;

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
          la línea de abajo; desde lg todo entra en una sola línea.
          top = headerHeight medido en vivo (no un valor fijo adivinado): el Header
          va por encima (z-50, sticky top-0) y su alto varía según breakpoint y
          según cambios que se le hagan — medirlo evita que quede tapando esta barra
          o dejando un hueco de más. */}
      <div ref={toolbarRef} className="sticky z-30 bg-white border-b border-gray-100" style={{ top: headerHeight }}>
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
          {/* Sidebar desktop — sticky, offset = header + barra de arriba medidos en
              vivo, para que no se tapen sin importar cuánto midan */}
          <div className="hidden lg:block w-64 shrink-0">
            <div
              className="sticky bg-white rounded-xl border border-gray-200 p-5"
              style={{ top: headerHeight + toolbarHeight }}
            >
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
              enrollmentProgress={enrollmentProgress}
              emptyMessage={
                hasActiveFilters
                  ? "No encontramos cursos con esos filtros. Prueba con otros criterios."
                  : "No hay cursos disponibles en este momento."
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