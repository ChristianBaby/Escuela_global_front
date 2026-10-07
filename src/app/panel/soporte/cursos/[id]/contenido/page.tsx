"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Video,
  Paperclip,
  X,
  Loader2,
  ExternalLink,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { cursosService } from "@/lib/services/courses";
import type { CreateSessionDto, MaterialItem } from "@/lib/services/courses/courses.service";
import type { VideoProvider } from "@/types";
import { MaterialPreview } from "@/components/organisms";
import { driveCheckQueryKey, driveLinkWarning } from "@/components/organisms/MaterialPreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ── Tipos ──────────────────────────────────────────────────────────────────────

type MaterialType = "PDF" | "Excel" | "Word" | "Otro" | "Video";

// ── Formulario de módulo ───────────────────────────────────────────────────────
// Definido FUERA del componente principal para que React no lo remonte en cada render.

interface ModuleFormProps {
  initialTitle?: string;
  initialDesc?: string;
  onSubmit: (title: string, desc: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function ModuleForm({ initialTitle = "", initialDesc = "", onSubmit, onCancel, loading }: ModuleFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc);

  return (
    <div className="border border-[#084D95]/30 bg-blue-50/30 rounded-lg p-4 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Título del módulo *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Introducción a las Finanzas"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (title.trim() && !loading) onSubmit(title, desc);
            }
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">
          Descripción <span className="text-gray-400">(opcional)</span>
        </Label>
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Breve descripción de este módulo..."
          rows={2}
          className="text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onSubmit(title, desc)}
          disabled={!title.trim() || loading}
          className="px-3 py-1.5 text-xs bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50 flex items-center gap-1"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Guardar
        </button>
      </div>
    </div>
  );
}

// ── Formulario de sesión ───────────────────────────────────────────────────────

interface SessionFormData {
  title: string;
  desc: string;
  provider: VideoProvider;
  videoUrl: string;
  duration: string;
}

interface SessionFormProps {
  initialTitle?: string;
  initialDesc?: string;
  initialProvider?: VideoProvider;
  initialYouTube?: string;
  initialDrive?: string;
  initialDuration?: string;
  onSubmit: (data: SessionFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

const VIDEO_PROVIDER_OPTIONS: { value: VideoProvider; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "drive", label: "Google Drive" },
];

function SessionForm({
  initialTitle = "",
  initialDesc = "",
  initialProvider = "youtube",
  initialYouTube = "",
  initialDrive = "",
  initialDuration = "",
  onSubmit,
  onCancel,
  loading,
}: SessionFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc);
  const [provider, setProvider] = useState<VideoProvider>(initialProvider);
  const [youtube, setYoutube] = useState(initialYouTube);
  const [drive, setDrive] = useState(initialDrive);
  const [duration, setDuration] = useState(initialDuration);
  // Aviso de Drive pendiente de confirmar: el siguiente "Guardar" guarda igual.
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const videoUrl = provider === "drive" ? drive : youtube;

  function changeProvider(next: VideoProvider) {
    setProvider(next);
    setDriveWarning(null);
  }

  async function handleSubmit() {
    const data = { title, desc, provider, videoUrl: videoUrl.trim(), duration };
    if (provider !== "drive" || driveWarning) {
      onSubmit(data);
      return;
    }

    setChecking(true);
    try {
      const inspection = await queryClient.fetchQuery({
        queryKey: driveCheckQueryKey(data.videoUrl),
        queryFn: () => cursosService.checkDriveLink(data.videoUrl),
        staleTime: 5 * 60 * 1000,
      });
      // El video principal tiene que ser un archivo: el backend rechaza carpetas
      // y documentos, así que eso no se puede "guardar de todos modos".
      if (inspection.provider === "google" && inspection.kind && inspection.kind !== "file") {
        toast.error("El enlace debe ser de un archivo de video de Drive, no de una carpeta ni de un documento.");
        return;
      }
      const warning = driveLinkWarning(inspection);
      if (warning) {
        setDriveWarning(warning);
        return;
      }
    } catch {
      // Si la verificación falla (red, timeout) no se bloquea el guardado.
    } finally {
      setChecking(false);
    }
    onSubmit(data);
  }

  return (
    <div className="border border-[#084D95]/30 bg-blue-50/30 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs">Título de la sesión *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Conceptos básicos de análisis financiero"
            autoFocus
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs">Fuente del video *</Label>
          <div className="flex gap-2" role="radiogroup" aria-label="Fuente del video">
            {VIDEO_PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={provider === opt.value}
                onClick={() => changeProvider(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  provider === opt.value
                    ? "bg-[#084D95] border-[#084D95] text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          {provider === "drive" ? (
            <>
              <Label className="text-xs">Enlace del video en Google Drive *</Label>
              <Input
                value={drive}
                onChange={(e) => {
                  setDrive(e.target.value);
                  setDriveWarning(null);
                }}
                placeholder="https://drive.google.com/file/d/.../view"
              />
              <p className="text-xs text-gray-400">
                Debe ser el enlace de un archivo de video (no una carpeta), compartido como
                &quot;Cualquier persona con el enlace&quot;. Si no se detecta la duración, ingrésala abajo.
              </p>
            </>
          ) : (
            <>
              <Label className="text-xs">URL de YouTube *</Label>
              <Input
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-400">
                La duración se detecta automáticamente desde YouTube.
              </p>
            </>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Duración (minutos){" "}
            <span className="text-gray-400 font-normal">(respaldo si falla la detección)</span>
          </Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Automático"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Descripción <span className="text-gray-400">(opcional)</span>
          </Label>
          <Input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Breve descripción..."
          />
        </div>
      </div>
      {driveWarning && (
        <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{driveWarning}</span>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || !videoUrl.trim() || loading || checking}
          className={`px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-50 flex items-center gap-1 ${
            driveWarning ? "bg-amber-600 hover:bg-amber-700" : "bg-[#084D95] hover:bg-[#084D95]/90"
          }`}
        >
          {(loading || checking) && <Loader2 size={12} className="animate-spin" />}
          {checking ? "Verificando enlace..." : driveWarning ? "Guardar de todos modos" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function toSessionPayload({ title, desc, provider, videoUrl, duration }: SessionFormData): CreateSessionDto {
  return {
    title: title.trim(),
    description: desc.trim() || undefined,
    video_provider: provider,
    ...(provider === "drive" ? { drive_url: videoUrl } : { youtube_url: videoUrl }),
    duration_minutes: duration ? parseFloat(duration) : undefined,
  };
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function ContenidoPage() {
  const params = useParams();
  const courseId = params.id as string;
  const queryClient = useQueryClient();

  // ── Estado: Módulos ────────────────────────────────────────────────────────
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // ── Estado: Sesiones ───────────────────────────────────────────────────────
  const [showAddSession, setShowAddSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // ── Estado: Materiales ─────────────────────────────────────────────────────
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [materialsData, setMaterialsData] = useState<Record<string, MaterialItem[]>>({});
  const [showAddMaterial, setShowAddMaterial] = useState<Record<string, boolean>>({});
  const [materialName, setMaterialName] = useState<Record<string, string>>({});
  const [materialUrl, setMaterialUrl] = useState<Record<string, string>>({});
  const [materialType, setMaterialType] = useState<Record<string, MaterialType>>({});
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  // Aviso pendiente de confirmar por sesión: si existe, el siguiente "Guardar"
  // guarda igual (el usuario ya vio el problema del enlace).
  const [materialWarning, setMaterialWarning] = useState<Record<string, string>>({});
  const [checkingMaterialFor, setCheckingMaterialFor] = useState<string | null>(null);

  useEffect(() => {
    if (!previewMaterial) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewMaterial(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewMaterial]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: course } = useQuery({
    queryKey: ["curso", courseId],
    queryFn: () => cursosService.get(courseId),
  });

  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: () => cursosService.getModules(courseId),
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", selectedModuleId],
    queryFn: () => cursosService.getSessions(selectedModuleId!),
    enabled: !!selectedModuleId,
  });

  // ── Mutations: Módulos ─────────────────────────────────────────────────────

  const createModuleMutation = useMutation({
    mutationFn: ({ title, desc }: { title: string; desc: string }) =>
      cursosService.createModule(courseId, { title, description: desc || undefined }),
    onSuccess: () => {
      toast.success("Módulo creado");
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      setShowAddModule(false);
    },
    onError: () => toast.error("No se pudo crear el módulo"),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, title, desc }: { moduleId: string; title: string; desc: string }) =>
      cursosService.updateModule(moduleId, { title, description: desc || undefined }),
    onSuccess: () => {
      toast.success("Módulo actualizado");
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      setEditingModuleId(null);
    },
    onError: () => toast.error("No se pudo actualizar el módulo"),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => cursosService.deleteModule(moduleId),
    onSuccess: (_, moduleId) => {
      toast.success("Módulo eliminado");
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      if (selectedModuleId === moduleId) setSelectedModuleId(null);
    },
    onError: () => toast.error("No se pudo eliminar el módulo"),
  });

  // ── Mutations: Sesiones ────────────────────────────────────────────────────

  const createSessionMutation = useMutation({
    mutationFn: (data: SessionFormData) =>
      cursosService.createSession(selectedModuleId!, toSessionPayload(data)),
    onSuccess: () => {
      toast.success("Sesión creada");
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      setShowAddSession(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo crear la sesión");
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, ...data }: SessionFormData & { sessionId: string }) =>
      cursosService.updateSession(sessionId, toSessionPayload(data)),
    onSuccess: () => {
      toast.success("Sesión actualizada");
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      setEditingSessionId(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo actualizar la sesión");
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => cursosService.deleteSession(sessionId),
    onSuccess: () => {
      toast.success("Sesión eliminada");
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
    onError: () => toast.error("No se pudo eliminar la sesión"),
  });

  // ── Mutations: Materiales ──────────────────────────────────────────────────

  const createMaterialMutation = useMutation({
    mutationFn: (sessionId: string) =>
      cursosService.createMaterial(sessionId, {
        name: materialName[sessionId]?.trim() ?? "",
        drive_url: materialUrl[sessionId]?.trim() ?? "",
        type: materialType[sessionId] ?? "PDF",
      }),
    onSuccess: async (_, sessionId) => {
      toast.success("Material agregado");
      const updated = await cursosService.getMaterials(sessionId);
      setMaterialsData((prev) => ({ ...prev, [sessionId]: updated }));
      setShowAddMaterial((prev) => ({ ...prev, [sessionId]: false }));
      setMaterialName((prev) => ({ ...prev, [sessionId]: "" }));
      setMaterialUrl((prev) => ({ ...prev, [sessionId]: "" }));
      setMaterialType((prev) => ({ ...prev, [sessionId]: "PDF" }));
      clearMaterialWarning(sessionId);
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
    },
    onError: () => toast.error("No se pudo agregar el material"),
  });

  function clearMaterialWarning(sessionId: string) {
    setMaterialWarning((prev) => {
      if (!(sessionId in prev)) return prev;
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  }

  async function handleSaveMaterial(sessionId: string) {
    if (materialWarning[sessionId]) {
      createMaterialMutation.mutate(sessionId);
      return;
    }

    const url = materialUrl[sessionId]?.trim() ?? "";
    setCheckingMaterialFor(sessionId);
    try {
      const inspection = await queryClient.fetchQuery({
        queryKey: driveCheckQueryKey(url),
        queryFn: () => cursosService.checkDriveLink(url),
        staleTime: 5 * 60 * 1000,
      });
      const warning = driveLinkWarning(inspection);
      if (warning) {
        setMaterialWarning((prev) => ({ ...prev, [sessionId]: warning }));
        return;
      }
    } catch {
      // Si la verificación falla (red, timeout) no se bloquea el guardado.
    } finally {
      setCheckingMaterialFor(null);
    }
    createMaterialMutation.mutate(sessionId);
  }

  const deleteMaterialMutation = useMutation({
    mutationFn: ({ materialId, sessionId }: { materialId: string; sessionId: string }) =>
      cursosService.deleteMaterial(materialId).then(() => sessionId),
    onSuccess: async (sessionId) => {
      toast.success("Material eliminado");
      const updated = await cursosService.getMaterials(sessionId);
      setMaterialsData((prev) => ({ ...prev, [sessionId]: updated }));
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
    },
    onError: () => toast.error("No se pudo eliminar el material"),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleSessionMaterials = async (sessionId: string) => {
    if (expandedSessions.has(sessionId)) {
      setExpandedSessions((prev) => { const n = new Set(prev); n.delete(sessionId); return n; });
    } else {
      setExpandedSessions((prev) => new Set([...prev, sessionId]));
      if (!materialsData[sessionId]) {
        const mats = await cursosService.getMaterials(sessionId);
        setMaterialsData((prev) => ({ ...prev, [sessionId]: mats }));
      }
    }
  };

  const selectedModule = modules?.find((m) => m.id === selectedModuleId);
  const editingModule = editingModuleId ? modules?.find((m) => m.id === editingModuleId) : null;
  const editingSession = editingSessionId ? sessions?.find((s) => s.id === editingSessionId) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/panel/soporte/cursos" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Contenido del curso</h1>
          {course && <p className="text-gray-500 text-sm truncate max-w-lg">{course.title}</p>}
        </div>
      </div>

      {/* Layout principal: dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Panel izquierdo: Módulos ──────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#084D95]" />
              <span className="font-medium text-gray-900 text-sm">Módulos</span>
              {modules && <span className="text-xs text-gray-400">({modules.length})</span>}
            </div>
            <button
              onClick={() => {
                setShowAddModule(true);
                setEditingModuleId(null);
              }}
              className="flex items-center gap-1 text-xs text-[#084D95] hover:underline"
            >
              <Plus size={14} />
              Agregar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Formulario de nuevo módulo */}
            {showAddModule && (
              <div className="p-3 border-b border-gray-100">
                <ModuleForm
                  key="new-module"
                  onSubmit={(title, desc) => {
                    if (!title.trim()) { toast.error("El título es obligatorio"); return; }
                    createModuleMutation.mutate({ title: title.trim(), desc: desc.trim() });
                  }}
                  onCancel={() => setShowAddModule(false)}
                  loading={createModuleMutation.isPending}
                />
              </div>
            )}

            {loadingModules ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 size={20} className="animate-spin text-[#084D95]" />
              </div>
            ) : modules?.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                Sin módulos. Agrega el primero.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {modules?.map((mod) => (
                  <li key={mod.id}>
                    {/* Formulario de edición de módulo */}
                    {editingModuleId === mod.id ? (
                      <div className="p-3">
                        <ModuleForm
                          key={`edit-${mod.id}`}
                          initialTitle={editingModule?.title ?? ""}
                          initialDesc={editingModule?.description ?? ""}
                          onSubmit={(title, desc) => {
                            if (!title.trim()) { toast.error("El título es obligatorio"); return; }
                            updateModuleMutation.mutate({ moduleId: mod.id, title: title.trim(), desc: desc.trim() });
                          }}
                          onCancel={() => setEditingModuleId(null)}
                          loading={updateModuleMutation.isPending}
                        />
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedModuleId(mod.id)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedModuleId(mod.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedModuleId === mod.id ? "bg-blue-50 border-l-2 border-[#084D95]" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedModuleId === mod.id ? "text-[#084D95]" : "text-gray-900"}`}>
                            {mod.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {mod.sessions_count ?? 0} sesión{(mod.sessions_count ?? 0) !== 1 ? "es" : ""}
                            {mod.total_duration ? ` · ${mod.total_duration} min` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingModuleId(mod.id)}
                            className="p-1 text-gray-400 hover:text-[#084D95] rounded transition-colors"
                            title="Editar módulo"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar el módulo "${mod.title}"?`)) {
                                deleteModuleMutation.mutate(mod.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Eliminar módulo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Panel derecho: Sesiones ───────────────────────────────────────── */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {!selectedModuleId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-gray-400">
              <Video size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-500">Selecciona un módulo</p>
              <p className="text-xs mt-1">Las sesiones del módulo aparecerán aquí</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-[#084D95]" />
                  <span className="font-medium text-gray-900 text-sm">
                    {selectedModule?.title ?? "Sesiones"}
                  </span>
                  {sessions && <span className="text-xs text-gray-400">({sessions.length})</span>}
                </div>
                <button
                  onClick={() => {
                    setShowAddSession(true);
                    setEditingSessionId(null);
                  }}
                  className="flex items-center gap-1 text-xs text-[#084D95] hover:underline"
                >
                  <Plus size={14} />
                  Agregar sesión
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Formulario nueva sesión */}
                {showAddSession && (
                  <div className="p-3 border-b border-gray-100">
                    <SessionForm
                      key="new-session"
                      onSubmit={(data) => {
                        if (!data.title.trim()) { toast.error("El título es obligatorio"); return; }
                        if (!data.videoUrl) { toast.error("El enlace del video es obligatorio"); return; }
                        createSessionMutation.mutate(data);
                      }}
                      onCancel={() => setShowAddSession(false)}
                      loading={createSessionMutation.isPending}
                    />
                  </div>
                )}

                {loadingSessions ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={20} className="animate-spin text-[#084D95]" />
                  </div>
                ) : sessions?.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    <Video size={28} className="mx-auto mb-2 opacity-30" />
                    Sin sesiones. Agrega la primera.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {sessions?.map((sess, idx) => (
                      <li key={sess.id} className="p-4">
                        {/* Formulario de edición de sesión */}
                        {editingSessionId === sess.id ? (
                          <SessionForm
                            key={`edit-${sess.id}`}
                            initialTitle={editingSession?.title ?? ""}
                            initialDesc={editingSession?.description ?? ""}
                            initialProvider={editingSession?.video_provider ?? "youtube"}
                            initialYouTube={editingSession?.youtube_url ?? ""}
                            initialDrive={editingSession?.drive_url ?? ""}
                            initialDuration={editingSession?.duration_minutes?.toString() ?? ""}
                            onSubmit={(data) => {
                              if (!data.title.trim()) { toast.error("El título es obligatorio"); return; }
                              if (!data.videoUrl) { toast.error("El enlace del video es obligatorio"); return; }
                              updateSessionMutation.mutate({ sessionId: sess.id, ...data });
                            }}
                            onCancel={() => setEditingSessionId(null)}
                            loading={updateSessionMutation.isPending}
                          />
                        ) : (
                          <>
                            {/* Cabecera de sesión */}
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{sess.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400">{sess.duration_minutes} min</span>
                                  {(sess.video_provider === "drive" ? sess.drive_url : sess.youtube_url) && (
                                    <a
                                      href={(sess.video_provider === "drive" ? sess.drive_url : sess.youtube_url)!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#084D95] hover:underline flex items-center gap-0.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink size={11} />
                                      {sess.video_provider === "drive" ? "Drive" : "YouTube"}
                                    </a>
                                  )}
                                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                    <Paperclip size={11} />
                                    {sess.materials_count ?? 0} material{(sess.materials_count ?? 0) !== 1 ? "es" : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => toggleSessionMaterials(sess.id)}
                                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                                  title={expandedSessions.has(sess.id) ? "Ocultar materiales" : "Ver materiales"}
                                >
                                  {expandedSessions.has(sess.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>
                                <button
                                  onClick={() => setEditingSessionId(sess.id)}
                                  className="p-1 text-gray-400 hover:text-[#084D95] rounded transition-colors"
                                  title="Editar sesión"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar la sesión "${sess.title}"? Se eliminará el progreso de los estudiantes.`)) {
                                      deleteSessionMutation.mutate(sess.id);
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                  title="Eliminar sesión"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Panel de materiales */}
                            {expandedSessions.has(sess.id) && (
                              <div className="ml-9 mt-3 border border-gray-100 rounded-lg overflow-hidden">
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-100">
                                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                                    <Paperclip size={12} />
                                    Materiales
                                  </span>
                                  <button
                                    onClick={() => setShowAddMaterial((prev) => ({ ...prev, [sess.id]: !prev[sess.id] }))}
                                    className="text-xs text-[#084D95] hover:underline flex items-center gap-0.5"
                                  >
                                    <Plus size={12} />
                                    Agregar
                                  </button>
                                </div>

                                {/* Formulario de nuevo material */}
                                {showAddMaterial[sess.id] && (
                                  <div className="p-3 border-b border-gray-100 bg-blue-50/30 space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Nombre *</Label>
                                        <Input
                                          value={materialName[sess.id] ?? ""}
                                          onChange={(e) => setMaterialName((prev) => ({ ...prev, [sess.id]: e.target.value }))}
                                          placeholder="Ej: Presentación PDF"
                                          className="text-xs h-8"
                                          autoFocus
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Tipo</Label>
                                        <select
                                          value={materialType[sess.id] ?? "PDF"}
                                          onChange={(e) => setMaterialType((prev) => ({ ...prev, [sess.id]: e.target.value as MaterialType }))}
                                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs h-8 focus:outline-none"
                                        >
                                          <option value="PDF">PDF</option>
                                          <option value="Excel">Excel</option>
                                          <option value="Word">Word</option>
                                          <option value="Otro">Otro</option>
                                          <option value="Video">Video (Drive)</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">URL de Google Drive *</Label>
                                      <Input
                                        value={materialUrl[sess.id] ?? ""}
                                        onChange={(e) => {
                                          setMaterialUrl((prev) => ({ ...prev, [sess.id]: e.target.value }));
                                          clearMaterialWarning(sess.id);
                                        }}
                                        placeholder="https://drive.google.com/file/d/..."
                                        className="text-xs h-8"
                                      />
                                    </div>
                                    {materialWarning[sess.id] && (
                                      <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                                        <span>{materialWarning[sess.id]}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setShowAddMaterial((prev) => ({ ...prev, [sess.id]: false }));
                                          clearMaterialWarning(sess.id);
                                        }}
                                        className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => handleSaveMaterial(sess.id)}
                                        disabled={
                                          !materialName[sess.id]?.trim() ||
                                          !materialUrl[sess.id]?.trim() ||
                                          createMaterialMutation.isPending ||
                                          checkingMaterialFor === sess.id
                                        }
                                        className={`text-xs px-2 py-1 text-white rounded disabled:opacity-50 flex items-center gap-1 ${
                                          materialWarning[sess.id]
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : "bg-[#084D95] hover:bg-[#084D95]/90"
                                        }`}
                                      >
                                        {(createMaterialMutation.isPending || checkingMaterialFor === sess.id) && (
                                          <Loader2 size={10} className="animate-spin" />
                                        )}
                                        {checkingMaterialFor === sess.id
                                          ? "Verificando enlace..."
                                          : materialWarning[sess.id]
                                            ? "Guardar de todos modos"
                                            : "Guardar"}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Lista de materiales */}
                                {(materialsData[sess.id] ?? []).length === 0 ? (
                                  <p className="text-xs text-gray-400 p-3 text-center">Sin materiales</p>
                                ) : (
                                  <ul className="divide-y divide-gray-50">
                                    {(materialsData[sess.id] ?? []).map((mat) => (
                                      <li key={mat.id} className="flex items-center gap-2 px-3 py-2">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                                          {mat.type}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setPreviewMaterial(mat)}
                                          className="flex-1 min-w-0 flex items-center gap-1.5 text-left text-xs text-gray-700 hover:text-[#084D95] transition-colors"
                                          title="Ver vista previa"
                                        >
                                          <span className="truncate">{mat.name}</span>
                                          <Eye size={12} className="shrink-0 text-gray-400" />
                                        </button>
                                        <a
                                          href={mat.drive_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#084D95] hover:text-[#084D95]/70"
                                          title="Abrir en una pestaña nueva"
                                          aria-label={`Abrir ${mat.name} en una pestaña nueva`}
                                        >
                                          <ExternalLink size={12} />
                                        </a>
                                        <button
                                          onClick={() => deleteMaterialMutation.mutate({ materialId: mat.id, sessionId: sess.id })}
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                          title="Eliminar material"
                                        >
                                          <X size={13} />
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal de vista previa de material ─────────────────────────────── */}
      {previewMaterial && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewMaterial(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Vista previa: ${previewMaterial.name}`}
            className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                  {previewMaterial.type}
                </span>
                <h2 className="text-sm font-semibold text-gray-900 truncate">{previewMaterial.name}</h2>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar vista previa"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <MaterialPreview
                url={previewMaterial.drive_url}
                title={previewMaterial.name}
                isVideo={previewMaterial.type === "Video"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
