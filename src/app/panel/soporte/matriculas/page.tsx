"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matriculasService, type CreateMatriculasDto } from "@/lib/services/enrollments";
import { cursosService } from "@/lib/services/courses";
import { usuariosService } from "@/lib/services/users";
import { toast } from "sonner";
import {
  Search, X, BookOpen, CheckCircle2, UserCheck, Users,
  ArrowRight, ArrowLeft, Info, PlusCircle,
} from "lucide-react";

/* ─── tipos ──────────────────────────────────────────────────────────── */
interface Estudiante {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  matriculado: boolean;
}

type EstadoFiltro = "todos" | "sin_matricular" | "matriculados";

const ESTUDIANTES_PAGE_SIZES = [15, 50, 100, 200];

const METODOS: { value: CreateMatriculasDto["offline_payment_method"]; label: string }[] = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "efectivo",      label: "Efectivo"               },
  { value: "cortesia",      label: "Cortesía"               },
  { value: "otro",          label: "Otro"                   },
];

const ESTADO_TABS: { value: EstadoFiltro; label: string }[] = [
  { value: "todos",          label: "Todos"          },
  { value: "sin_matricular", label: "Sin matricular" },
  { value: "matriculados",   label: "Matriculados"   },
];

/* ─── helpers ────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-amber-500", "bg-rose-500",   "bg-cyan-500",
];

function Avatar({ first_name, last_name }: { first_name: string; last_name: string }) {
  const initials = (first_name[0] + (last_name?.[0] ?? "")).toUpperCase();
  const color    = AVATAR_COLORS[first_name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className={`${color} text-white rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ width: 34, height: 34, fontSize: 12 }}
    >
      {initials}
    </div>
  );
}

/* Quita tildes y diacríticos para búsqueda tolerante */
function normalize(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function StepPill({ step, label, state }: { step: number; label: string; state: "idle" | "active" | "done" }) {
  const base = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border";
  const cls =
    state === "active" ? `${base} bg-blue-50 text-[#084D95] border-blue-200` :
    state === "done"   ? `${base} bg-emerald-50 text-emerald-700 border-emerald-200` :
                         `${base} bg-gray-50 text-gray-400 border-gray-200`;
  return (
    <div className={cls}>
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
          ${state === "active" ? "bg-[#084D95] text-white" :
            state === "done"   ? "bg-emerald-600 text-white" :
                                 "bg-gray-300 text-white"}`}
      >
        {state === "done" ? "✓" : step}
      </span>
      {label}
    </div>
  );
}

/* ─── componente principal ───────────────────────────────────────────── */
export default function MatriculasPage() {
  const queryClient = useQueryClient();

  /* step wizard */
  const [step, setStep] = useState<1 | 2>(1);

  /* step 1 – selección de cursos */
  const [cursosBusqueda,      setCursosBusqueda]      = useState("");
  const [cursosSeleccionados, setCursosSeleccionados] = useState<string[]>([]);

  /* step 2 – selección de estudiantes */
  const [busqueda,          setBusqueda]          = useState("");
  const [debouncedBusqueda, setDebouncedBusqueda] = useState("");
  const [estadoFiltro,      setEstadoFiltro]      = useState<EstadoFiltro>("todos");
  const [seleccionados,     setSeleccionados]     = useState<string[]>([]);
  const [searchFocused,     setSearchFocused]     = useState(false);
  const [estudiantesPage,   setEstudiantesPage]   = useState(1);
  const [estudiantesLimit,  setEstudiantesLimit]  = useState(50);

  /* pago */
  const [metodo, setMetodo] = useState<CreateMatriculasDto["offline_payment_method"]>("transferencia");
  const [monto,  setMonto]  = useState("");
  const [notas,  setNotas]  = useState("");

  /* pantalla de éxito tras matricular */
  const [justFinished, setJustFinished] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);

  /* Debounce de 300ms; al cambiar búsqueda vuelve a página 1 */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
      setEstudiantesPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchFocused(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── datos ── */
  const { data: cursosData } = useQuery({
    queryKey: ["cursos-activos"],
    queryFn:  () => cursosService.list({ status: "published", limit: 100 }),
  });

  /* Lista paginada de estudiantes: carga todos al entrar al paso 2;
     cuando hay búsqueda activa filtra server-side y vuelve a p. 1 */
  const { data: estudiantesData, isLoading: loadingEstudiantes } = useQuery({
    queryKey: ["estudiantes-matriculas", estudiantesPage, estudiantesLimit, debouncedBusqueda],
    queryFn:  () =>
      usuariosService.list({
        role:   "estudiante",
        search: debouncedBusqueda || undefined,
        page:   estudiantesPage,
        limit:  estudiantesLimit,
        sort:   "first_name",
      }),
    enabled: step === 2,
  });

  const { data: enrollmentsPorCurso } = useQuery({
    queryKey: ["enrollments-por-cursos", cursosSeleccionados],
    queryFn:  () =>
      Promise.all(
        cursosSeleccionados.map((id) =>
          matriculasService.list({ curso_id: id, limit: 10000 })
        )
      ),
    enabled: step === 2 && cursosSeleccionados.length > 0,
  });

  const matricularMutation = useMutation({
    mutationFn: matriculasService.create,
  });

  /* ── estudiantes con estado de matrícula derivado, ordenados A-Z ── */
  const estudiantesConMatriculado = useMemo<Estudiante[]>(() => {
    const matriculados = new Set(
      (enrollmentsPorCurso ?? []).flatMap((r) => r.data.map((e) => e.user_id))
    );
    return (estudiantesData?.data ?? [])
      .map((u) => ({
        id:          u.id,
        first_name:  u.first_name,
        last_name:   u.last_name,
        email:       u.email,
        matriculado: matriculados.has(u.id),
      }))
      .sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`,
          "es",
          { sensitivity: "base" }
        )
      );
  }, [estudiantesData, enrollmentsPorCurso]);

  /* ── filtro de estado (aplica sobre los resultados de la búsqueda) ── */
  const estudiantesFiltrados = useMemo(() => {
    if (estadoFiltro === "matriculados")   return estudiantesConMatriculado.filter(e => e.matriculado);
    if (estadoFiltro === "sin_matricular") return estudiantesConMatriculado.filter(e => !e.matriculado);
    return estudiantesConMatriculado;
  }, [estudiantesConMatriculado, estadoFiltro]);

  /* ── filtros de cursos ── */
  const cursosFiltrados = (cursosData?.data ?? [])
    .filter((c) => normalize(c.title).includes(normalize(cursosBusqueda)))
    .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));

  /* ── select-all: opera solo sobre los visibles y no matriculados ── */
  const noMatriculadosVisibles = estudiantesFiltrados.filter(e => !e.matriculado);
  const todosSeleccionados     = noMatriculadosVisibles.length > 0
    && noMatriculadosVisibles.every(e => seleccionados.includes(e.id));

  /* ── handlers ── */
  const toggleCurso = (id: string) =>
    setCursosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleEstudiante = (id: string) => {
    const est = estudiantesConMatriculado.find((e) => e.id === id);
    if (est?.matriculado) return;
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    const ids = noMatriculadosVisibles.map(e => e.id);
    setSeleccionados(todosSeleccionados
      ? seleccionados.filter(id => !ids.includes(id))
      : [...new Set([...seleccionados, ...ids])]
    );
  };

  const goToStep2 = () => {
    if (!cursosSeleccionados.length) {
      toast.error("Selecciona al menos un curso");
      return;
    }
    setStep(2);
    setSeleccionados([]);
    setBusqueda("");
    setDebouncedBusqueda("");
    setEstadoFiltro("todos");
    setEstudiantesPage(1);
  };

  const goBack = () => {
    setStep(1);
    setSeleccionados([]);
  };

  const handleMatricular = async () => {
    if (!seleccionados.length) {
      toast.error("Selecciona al menos un estudiante");
      return;
    }

    const results = await Promise.allSettled(
      seleccionados.map((userId) =>
        matricularMutation.mutateAsync({
          user_id:                userId,
          course_ids:             cursosSeleccionados,
          offline_payment_method: metodo,
          offline_amount:         monto ? parseFloat(monto) : undefined,
          internal_notes:         notas || undefined,
        })
      )
    );

    const failed    = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    queryClient.invalidateQueries({ queryKey: ["enrollments-por-cursos"] });
    queryClient.invalidateQueries({ queryKey: ["cursos"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-top-cursos"] });

    if (failed > 0) toast.error(`${failed} matrícula(s) fallaron`);
    if (succeeded > 0) {
      setLastTotal(succeeded * cursosSeleccionados.length);
      setJustFinished(true);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setCursosSeleccionados([]);
    setSeleccionados([]);
    setCursosBusqueda("");
    setBusqueda("");
    setDebouncedBusqueda("");
    setEstadoFiltro("todos");
    setEstudiantesPage(1);
    setMetodo("transferencia");
    setMonto("");
    setNotas("");
    setJustFinished(false);
  };

  const totalMatriculas = seleccionados.length * cursosSeleccionados.length;

  /* ── contadores para las tabs ── */
  const cuentas = {
    todos:          estudiantesConMatriculado.length,
    sin_matricular: estudiantesConMatriculado.filter(e => !e.matriculado).length,
    matriculados:   estudiantesConMatriculado.filter(e => e.matriculado).length,
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Matriculas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión manual de matrículas por curso</p>
        </div>
      </div>

      {/* ── Step pills ────────────────────────────────────────────── */}
      {!justFinished && (
        <div className="flex items-center gap-2">
          <StepPill step={1} label="Cursos"                state={step === 1 ? "active" : "done"} />
          <div className="w-6 h-px bg-gray-300" />
          <StepPill step={2} label="Estudiantes &amp; pago" state={step === 2 ? "active" : "idle"} />
        </div>
      )}

      {/* ════════════════ PANTALLA DE ÉXITO ════════════════ */}
      {justFinished && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-brand-primary">
              {lastTotal} matrícula(s) creada(s) correctamente
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Los estudiantes ya tienen acceso a los cursos y recibieron su notificación.
            </p>
          </div>
          <button
            onClick={resetWizard}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#084D95] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3d7a] transition-colors mt-2"
          >
            <PlusCircle className="size-4" />
            Nueva matrícula
          </button>
        </div>
      )}

      {/* ════════════════ STEP 1 — CURSOS ════════════════ */}
      {!justFinished && step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="size-4 text-[#084D95]" />
              <h2 className="font-semibold text-gray-800 text-sm">Selecciona los cursos</h2>
              {cursosData?.data && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {cursosData.data.length} disponibles
                </span>
              )}
              {cursosSeleccionados.length > 0 && (
                <span className="text-xs bg-[#084D95] text-white px-2 py-0.5 rounded-full font-medium ml-auto">
                  {cursosSeleccionados.length} seleccionado(s)
                </span>
              )}
            </div>

            {/* Buscador */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar curso por nombre..."
                value={cursosBusqueda}
                onChange={(e) => setCursosBusqueda(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-8 h-10 text-sm outline-none focus:ring-2 focus:ring-[#084D95]/30 focus:border-[#084D95]"
              />
              {cursosBusqueda && (
                <button
                  onClick={() => setCursosBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Grid de cursos con checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {cursosFiltrados.map((c) => {
                const isSel = cursosSeleccionados.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCurso(c.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      isSel
                        ? "border-[#084D95] bg-blue-50"
                        : "border-gray-200 hover:border-[#084D95]/40 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSel ? "bg-[#084D95]" : "bg-gray-100"
                      }`}>
                        <BookOpen className={`size-4 ${isSel ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSel ? "text-[#084D95]" : "text-gray-900"}`}>
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.currency} {c.price} · {c.enrolled_count} matriculados
                        </p>
                      </div>
                      {isSel && <CheckCircle2 className="size-4 text-[#084D95] shrink-0 mt-0.5" />}
                    </div>
                  </button>
                );
              })}

              {cursosFiltrados.length === 0 && (
                <div className="col-span-3 text-center py-6 text-gray-400 text-sm">
                  No se encontraron cursos con &ldquo;{cursosBusqueda}&rdquo;
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={goToStep2}
              disabled={cursosSeleccionados.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#084D95] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3d7a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente: elegir estudiantes
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ STEP 2 — ESTUDIANTES ════════════════ */}
      {!justFinished && step === 2 && (
        <div className="space-y-4">

          {/* Cursos elegidos (resumen) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-[#084D95]" />
                <span className="text-sm font-semibold text-gray-800">Cursos seleccionados</span>
              </div>
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-xs text-[#084D95] hover:underline"
              >
                <ArrowLeft className="size-3" /> Cambiar cursos
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cursosSeleccionados.map((id) => {
                const c = cursosData?.data.find((x) => x.id === id);
                if (!c) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-[#084D95] border border-blue-200 px-2.5 py-1 rounded-full font-medium"
                  >
                    <BookOpen className="size-3" />
                    {c.title}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Panel de estudiantes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Cabecera: título + buscador */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Users className="size-4 text-[#084D95]" />
                <h2 className="font-semibold text-gray-800 text-sm">Estudiantes</h2>
                {seleccionados.length > 0 && (
                  <span className="bg-[#084D95] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {seleccionados.length} seleccionado(s)
                  </span>
                )}
              </div>

              {/* Buscador con dropdown */}
              <div ref={searchRef} className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setSearchFocused(true); }}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-8 h-9 text-sm outline-none focus:ring-2 focus:ring-[#084D95]/30 focus:border-[#084D95]"
                />
                {busqueda && (
                  <button
                    onClick={() => { setBusqueda(""); setSearchFocused(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}

                {/* Dropdown sugerencias (solo con texto activo) */}
                {searchFocused && busqueda.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {loadingEstudiantes ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">Buscando...</div>
                    ) : estudiantesConMatriculado.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        Sin resultados para &ldquo;{busqueda}&rdquo;
                      </div>
                    ) : (
                      estudiantesConMatriculado.slice(0, 5).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => { toggleEstudiante(e.id); setSearchFocused(false); setBusqueda(""); }}
                          disabled={e.matriculado}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                          <Avatar first_name={e.first_name} last_name={e.last_name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{e.first_name} {e.last_name}</p>
                            <p className="text-xs text-gray-400 truncate">{e.email}</p>
                          </div>
                          {e.matriculado
                            ? <span className="text-xs text-emerald-600 font-medium shrink-0">Ya matriculado</span>
                            : seleccionados.includes(e.id)
                              ? <CheckCircle2 className="size-4 text-[#084D95] shrink-0" />
                              : null
                          }
                        </button>
                      ))
                    )}
                    {estudiantesConMatriculado.length > 5 && (
                      <div className="px-4 py-2 text-xs text-gray-400 text-center bg-gray-50">
                        +{estudiantesConMatriculado.length - 5} resultados más — escribe más para filtrar
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs: Todos / Sin matricular / Matriculados */}
            {estudiantesConMatriculado.length > 0 && (
              <div className="flex items-center gap-1 px-5 py-3 border-b border-gray-100">
                {ESTADO_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setEstadoFiltro(tab.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      estadoFiltro === tab.value
                        ? "bg-[#084D95] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      estadoFiltro === tab.value
                        ? "bg-white/25 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {cuentas[tab.value]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Banner resumen de matrículas */}
            {seleccionados.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border-b border-blue-100 text-xs text-[#084D95]">
                <Info className="size-3.5 shrink-0" />
                Se crearán <strong>{totalMatriculas} matrícula(s)</strong>:&nbsp;
                {seleccionados.length} estudiante(s) × {cursosSeleccionados.length} curso(s)
              </div>
            )}

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={toggleTodos}
                        disabled={noMatriculadosVisibles.length === 0}
                        className="rounded border-gray-300 cursor-pointer accent-[#084D95] disabled:cursor-not-allowed"
                        title="Seleccionar todos"
                      />
                    </th>
                    <th className="text-left px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Estudiante</th>
                    <th className="text-left px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="text-left px-3 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Cargando */}
                  {loadingEstudiantes && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                        Cargando estudiantes...
                      </td>
                    </tr>
                  )}

                  {/* Sin resultados */}
                  {!loadingEstudiantes && estudiantesConMatriculado.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                        {debouncedBusqueda
                          ? `Sin resultados para "${debouncedBusqueda}"`
                          : "Sin estudiantes registrados"}
                      </td>
                    </tr>
                  )}

                  {/* Sin resultados por filtro de estado */}
                  {!loadingEstudiantes && estudiantesConMatriculado.length > 0 && estudiantesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                        No hay estudiantes en esta categoría
                      </td>
                    </tr>
                  )}

                  {/* Filas de estudiantes */}
                  {estudiantesFiltrados.map((estudiante) => {
                    const isSelected    = seleccionados.includes(estudiante.id);
                    const isMatriculado = estudiante.matriculado;
                    return (
                      <tr
                        key={estudiante.id}
                        onClick={() => toggleEstudiante(estudiante.id)}
                        className={`transition-colors ${
                          isMatriculado
                            ? "cursor-not-allowed opacity-60"
                            : isSelected
                              ? "bg-blue-50/70 cursor-pointer"
                              : "hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        <td className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEstudiante(estudiante.id)}
                            disabled={isMatriculado}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed accent-[#084D95]"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar first_name={estudiante.first_name} last_name={estudiante.last_name} />
                            <div>
                              <p className="font-medium text-gray-900">{estudiante.first_name} {estudiante.last_name}</p>
                              <p className="text-xs text-gray-400 sm:hidden">{estudiante.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{estudiante.email}</td>
                        <td className="px-3 py-3">
                          {isMatriculado ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                              <UserCheck className="size-3" /> Ya matriculado
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                              <CheckCircle2 className="size-3" /> Seleccionado
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Sin matricular</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {estudiantesData && estudiantesData.total > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>
                    Página {estudiantesPage} de {estudiantesData.total_pages} — {estudiantesData.total} estudiantes
                  </span>
                  <label className="flex items-center gap-1.5">
                    Por página
                    <select
                      value={estudiantesLimit}
                      onChange={(e) => { setEstudiantesLimit(Number(e.target.value)); setEstudiantesPage(1); }}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      {ESTUDIANTES_PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEstudiantesPage(p => Math.max(1, p - 1))}
                    disabled={estudiantesPage === 1}
                    className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setEstudiantesPage(p => Math.min(estudiantesData.total_pages, p + 1))}
                    disabled={estudiantesPage === estudiantesData.total_pages}
                    className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {/* Panel de pago y acción */}
            {seleccionados.length > 0 && (
              <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Método de pago</label>
                      <select
                        value={metodo}
                        onChange={(e) => setMetodo(e.target.value as CreateMatriculasDto["offline_payment_method"])}
                        className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm outline-none focus:ring-2 focus:ring-[#084D95]/30 bg-white"
                      >
                        {METODOS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Monto (opcional)</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm outline-none focus:ring-2 focus:ring-[#084D95]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Notas internas</label>
                      <input
                        type="text"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Observaciones..."
                        className="w-full border border-gray-300 rounded-lg px-3 h-9 text-sm outline-none focus:ring-2 focus:ring-[#084D95]/30"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleMatricular}
                    disabled={matricularMutation.isPending}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#084D95] text-white text-sm font-semibold rounded-lg hover:bg-[#1e3d7a] transition-colors disabled:opacity-50 shrink-0 h-9"
                  >
                    <UserCheck className="size-4" />
                    {matricularMutation.isPending
                      ? "Matriculando..."
                      : `Matricular ${seleccionados.length} × ${cursosSeleccionados.length} (${totalMatriculas})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
