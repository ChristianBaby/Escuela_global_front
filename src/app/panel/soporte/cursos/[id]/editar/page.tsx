"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { cursosService } from "@/lib/services/courses";
import { categoriasService } from "@/lib/services/categories";
import type { InstructorInput } from "@/lib/services/courses/courses.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const EMPTY_INSTRUCTOR: InstructorInput = { full_name: "", title: "", description: "" };

export default function EditarCursoPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  // ── Tab 1: Información básica ──────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState<"principiante" | "intermedio" | "avanzado">("principiante");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [softwareInput, setSoftwareInput] = useState("");
  const [softwareTools, setSoftwareTools] = useState<string[]>([]);

  // ── Tab 2: Pricing ─────────────────────────────────────────────────────────
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [currency, setCurrency] = useState<"USD" | "PEN">("USD");
  const [accessDuration, setAccessDuration] = useState<"1_year" | "lifetime">("lifetime");

  // ── Tab 3: Docentes ────────────────────────────────────────────────────────
  const [instructors, setInstructors] = useState<InstructorInput[]>([{ ...EMPTY_INSTRUCTOR }]);

  // ── Tab 4: Contenido ───────────────────────────────────────────────────────
  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [outcomeInput, setOutcomeInput] = useState("");
  const [outcomes, setOutcomes] = useState<string[]>([]);

  // ── Tab 5: Configuración ───────────────────────────────────────────────────
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["curso", courseId],
    queryFn: () => cursosService.get(courseId),
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.list,
  });

  // Pre-populate form fields when course data loads
  useEffect(() => {
    if (!course || initialized) return;
    setTitle(course.title);
    setSlug(course.slug);
    setSlugManual(true);
    setTagline(course.tagline ?? "");
    setDescription(course.description ?? "");
    setCategoryId(course.category_id ?? "");
    setLevel(course.level);
    setThumbnailPreview(course.thumbnail_url ?? "");
    setSoftwareTools(course.software_tools ?? []);
    setPrice(course.price?.toString() ?? "");
    setDiscountPrice(course.discount_price?.toString() ?? "");
    setCurrency(course.currency ?? "USD");
    setAccessDuration(course.access_duration ?? "lifetime");
    setPrerequisites(course.prerequisites ?? []);
    setOutcomes(course.outcomes ?? []);
    setStatus(course.status ?? "draft");
    if (course.instructors?.length) {
      setInstructors(
        course.instructors.map((ins) => ({
          full_name: ins.full_name,
          title: ins.title,
          description: ins.description ?? "",
          photo_url: ins.photo_url,
        }))
      );
    }
    setInitialized(true);
  }, [course, initialized]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await cursosService.update(courseId, {
        title,
        slug: slug || undefined,
        tagline,
        description,
        category_id: categoryId,
        level,
        software_tools: softwareTools,
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : undefined,
        currency,
        access_duration: accessDuration,
        instructors,
        prerequisites,
        outcomes,
        status,
      });

      if (thumbnail) {
        await cursosService.uploadThumbnail(courseId, thumbnail);
      }
    },
    onSuccess: () => {
      toast.success("Curso actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      queryClient.invalidateQueries({ queryKey: ["curso", courseId] });
      router.push("/panel/soporte/cursos");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al actualizar el curso");
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(toSlug(val));
  };

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(toSlug(val));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB");
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addSoftware = () => {
    const val = softwareInput.trim();
    if (val && !softwareTools.includes(val)) setSoftwareTools((p) => [...p, val]);
    setSoftwareInput("");
  };

  const addPrerequisite = () => {
    const val = prerequisiteInput.trim();
    if (val) setPrerequisites((p) => [...p, val]);
    setPrerequisiteInput("");
  };

  const addOutcome = () => {
    const val = outcomeInput.trim();
    if (val) setOutcomes((p) => [...p, val]);
    setOutcomeInput("");
  };

  const updateInstructor = (i: number, field: keyof InstructorInput, val: string) =>
    setInstructors((prev) => prev.map((ins, idx) => (idx === i ? { ...ins, [field]: val } : ins)));

  const validateForSave = () => {
    if (!title.trim()) { toast.error("El título es obligatorio"); return false; }
    if (!categoryId) { toast.error("Selecciona una categoría"); return false; }
    if (!price || parseFloat(price) <= 0) { toast.error("El precio debe ser mayor a 0"); return false; }
    if (!instructors[0]?.full_name.trim()) { toast.error("Agrega al menos un docente con nombre"); return false; }
    if (!instructors[0]?.title.trim()) { toast.error("El docente debe tener un título / profesión"); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validateForSave()) return;
    updateMutation.mutate();
  };

  const discountPct =
    price && discountPrice && parseFloat(price) > 0 && parseFloat(discountPrice) > 0
      ? Math.round((1 - parseFloat(discountPrice) / parseFloat(price)) * 100)
      : null;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#2B55A3]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16 text-gray-500">
        Curso no encontrado.{" "}
        <Link href="/panel/soporte/cursos" className="text-[#2B55A3] hover:underline">
          Volver a cursos
        </Link>
      </div>
    );
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/panel/soporte/cursos" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar curso</h1>
          <p className="text-gray-500 text-sm truncate max-w-lg">{course.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Tabs defaultValue="basico">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="basico">Información básica</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="docentes">Docentes</TabsTrigger>
            <TabsTrigger value="contenido">Contenido</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          {/* ──────────────────── TAB 1: Información básica ──────────────────── */}
          <TabsContent value="basico" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej: Máster en Finanzas Corporativas"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="master-en-finanzas-corporativas"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  URL pública: /cursos/<span className="text-gray-600">{slug || "..."}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tagline">
                Descripción corta{" "}
                <span className="text-gray-400 text-xs font-normal">({tagline.length}/150)</span>
              </Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, 150))}
                placeholder="Frase breve que resume el curso (máx. 150 caracteres)"
                maxLength={150}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción completa *</Label>
              <Textarea
                id="descripcion"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción detallada del curso..."
                rows={7}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="categoria">Categoría *</Label>
                <select
                  id="categoria"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nivel">Nivel</Label>
                <select
                  id="nivel"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as typeof level)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                >
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label>Thumbnail del curso (máx. 2 MB · JPG/PNG)</Label>
              <div className="flex items-start gap-4">
                {thumbnailPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-36 h-24 object-cover rounded-lg border border-gray-200 shrink-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-36 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <ImageIcon size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Seleccionar</span>
                  </button>
                )}
                <div className="pt-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-sm text-[#2B55A3] hover:underline"
                  >
                    <Upload size={14} />
                    {thumbnailPreview ? "Cambiar imagen" : "Subir imagen"}
                  </button>
                  {thumbnailPreview && (
                    <button
                      type="button"
                      onClick={clearThumbnail}
                      className="block text-sm text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                  <p className="text-xs text-gray-400">
                    {thumbnail ? thumbnail.name : "Sin cambios en la imagen"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>
              </div>
            </div>

            {/* Softwares */}
            <div className="space-y-1.5">
              <Label>Softwares / Herramientas</Label>
              <div className="flex gap-2">
                <Input
                  value={softwareInput}
                  onChange={(e) => setSoftwareInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addSoftware(); }
                  }}
                  placeholder="Ej: Excel, AutoCAD, SPSS..."
                  className="max-w-xs"
                />
                <button
                  type="button"
                  onClick={addSoftware}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Agregar
                </button>
              </div>
              {softwareTools.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {softwareTools.map((tool) => (
                    <span
                      key={tool}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                    >
                      {tool}
                      <button type="button" onClick={() => setSoftwareTools((p) => p.filter((t) => t !== tool))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ──────────────────── TAB 2: Pricing ──────────────────── */}
          <TabsContent value="pricing" className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="precio">Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">
                    {currency}
                  </span>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-14"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descuento">
                  Precio con descuento{" "}
                  <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">
                    {currency}
                  </span>
                  <Input
                    id="descuento"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="pl-14"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="moneda">Moneda</Label>
                <select
                  id="moneda"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "USD" | "PEN")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                >
                  <option value="USD">USD — Dólar americano</option>
                  <option value="PEN">PEN — Sol peruano</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acceso">Duración del acceso</Label>
                <select
                  id="acceso"
                  value={accessDuration}
                  onChange={(e) => setAccessDuration(e.target.value as "1_year" | "lifetime")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                >
                  <option value="lifetime">De por vida</option>
                  <option value="1_year">1 año</option>
                </select>
              </div>
            </div>

            {discountPct !== null && discountPct > 0 && discountPct < 100 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Descuento del <strong>{discountPct}%</strong> — Precio tachado:{" "}
                <span className="line-through">
                  {currency} {parseFloat(price).toFixed(2)}
                </span>{" "}
                → Precio final:{" "}
                <strong>
                  {currency} {parseFloat(discountPrice).toFixed(2)}
                </strong>
              </div>
            )}
          </TabsContent>

          {/* ──────────────────── TAB 3: Docentes ──────────────────── */}
          <TabsContent value="docentes" className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Agrega los docentes que impartirán este curso. Se requiere al menos uno para publicar.
              </p>
              <button
                type="button"
                onClick={() => setInstructors((p) => [...p, { ...EMPTY_INSTRUCTOR }])}
                className="flex items-center gap-1.5 text-sm text-[#2B55A3] hover:underline"
              >
                <Plus size={15} />
                Agregar docente
              </button>
            </div>

            {instructors.map((ins, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Docente {i + 1}</h3>
                  {instructors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInstructors((p) => p.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre completo *</Label>
                    <Input
                      value={ins.full_name}
                      onChange={(e) => updateInstructor(i, "full_name", e.target.value)}
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Profesión / Título *</Label>
                    <Input
                      value={ins.title}
                      onChange={(e) => updateInstructor(i, "title", e.target.value)}
                      placeholder="Economista · MBA Stanford"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Descripción{" "}
                    <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    value={ins.description ?? ""}
                    onChange={(e) => updateInstructor(i, "description", e.target.value)}
                    placeholder="Breve bio del docente: experiencia, especialidades, logros..."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ──────────────────── TAB 4: Contenido ──────────────────── */}
          <TabsContent value="contenido" className="space-y-8 max-w-2xl">
            {/* Requisitos previos */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">Requisitos previos</h3>
                <p className="text-sm text-gray-500 mt-0.5">¿Qué debe saber el estudiante antes de empezar?</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addPrerequisite(); }
                  }}
                  placeholder="Ej: Conocimiento básico de Excel"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={addPrerequisite}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  Agregar
                </button>
              </div>
              {prerequisites.length > 0 ? (
                <ul className="space-y-2">
                  {prerequisites.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2B55A3] shrink-0" />
                      <span className="flex-1">{p}</span>
                      <button
                        type="button"
                        onClick={() => setPrerequisites((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin requisitos añadidos</p>
              )}
            </div>

            {/* Lo que aprenderás */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">Lo que aprenderás</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Habilidades o conocimientos que obtendrá el estudiante al terminar el curso
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={outcomeInput}
                  onChange={(e) => setOutcomeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addOutcome(); }
                  }}
                  placeholder="Ej: Analizar estados financieros de forma profesional"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={addOutcome}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  Agregar
                </button>
              </div>
              {outcomes.length > 0 ? (
                <ul className="space-y-2">
                  {outcomes.map((o, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500 shrink-0">✓</span>
                      <span className="flex-1">{o}</span>
                      <button
                        type="button"
                        onClick={() => setOutcomes((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin resultados añadidos</p>
              )}
            </div>
          </TabsContent>

          {/* ──────────────────── TAB 5: Configuración ──────────────────── */}
          <TabsContent value="config" className="space-y-6">
            <div className="space-y-3 max-w-lg">
              <Label>Estado del curso</Label>
              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      value: "draft",
                      label: "Borrador",
                      desc: "No visible para los estudiantes. Puedes seguir editando.",
                    },
                    {
                      value: "published",
                      label: "Publicado",
                      desc: "Visible y disponible en el catálogo para su compra.",
                    },
                    {
                      value: "archived",
                      label: "Archivado",
                      desc: "Oculto del catálogo. Los matriculados mantienen acceso.",
                    },
                  ] as const
                ).map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      status === value
                        ? "border-[#2B55A3] bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={status === value}
                      onChange={() => setStatus(value)}
                      className="mt-0.5 accent-[#2B55A3]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-gray-200 flex items-center justify-between">
              <Link
                href="/panel/soporte/cursos"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
