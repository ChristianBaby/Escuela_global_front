"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cursosService } from "@/lib/services/courses";
import type { MaterialItem } from "@/lib/services/courses/courses.service";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ── Tipos ──────────────────────────────────────────────────────────────────────

type MaterialType = "PDF" | "Excel" | "Word" | "Otro";

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
    <div className="border border-[#2B55A3]/30 bg-blue-50/30 rounded-lg p-4 space-y-3">
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
          className="px-3 py-1.5 text-xs bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50 flex items-center gap-1"
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
  youtube: string;
  duration: string;
}

interface SessionFormProps {
  initialTitle?: string;
  initialDesc?: string;
  initialYouTube?: string;
  initialDuration?: string;
  onSubmit: (data: SessionFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

function SessionForm({
  initialTitle = "",
  initialDesc = "",
  initialYouTube = "",
  initialDuration = "",
  onSubmit,
  onCancel,
  loading,
}: SessionFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc);
  const [youtube, setYoutube] = useState(initialYouTube);
  const [duration, setDuration] = useState(initialDuration);

  return (
    <div className="border border-[#2B55A3]/30 bg-blue-50/30 rounded-lg p-4 space-y-3">
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
          <Label className="text-xs">URL de YouTube *</Label>
          <Input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duración (minutos) *</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45"
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
          onClick={() => onSubmit({ title, desc, youtube, duration })}
          disabled={!title.trim() || !youtube.trim() || !duration || loading}
          className="px-3 py-1.5 text-xs bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50 flex items-center gap-1"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Guardar
        </button>
      </div>
    </div>
  );
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
    mutationFn: ({ title, desc, youtube, duration }: SessionFormData) =>
      cursosService.createSession(selectedModuleId!, {
        title,
        description: desc || undefined,
        youtube_url: youtube,
        duration_minutes: parseFloat(duration) || 0,
      }),
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
    mutationFn: ({ sessionId, title, desc, youtube, duration }: SessionFormData & { sessionId: string }) =>
      cursosService.updateSession(sessionId, {
        title,
        description: desc || undefined,
        youtube_url: youtube,
        duration_minutes: parseFloat(duration) || 0,
      }),
    onSuccess: () => {
      toast.success("Sesión actualizada");
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
      setEditingSessionId(null);
    },
    onError: () => toast.error("No se pudo actualizar la sesión"),
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
      queryClient.invalidateQueries({ queryKey: ["sessions", selectedModuleId] });
    },
    onError: () => toast.error("No se pudo agregar el material"),
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Contenido del curso</h1>
          {course && <p className="text-gray-500 text-sm truncate max-w-lg">{course.title}</p>}
        </div>
      </div>

      {/* Layout principal: dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Panel izquierdo: Módulos ──────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#2B55A3]" />
              <span className="font-medium text-gray-900 text-sm">Módulos</span>
              {modules && <span className="text-xs text-gray-400">({modules.length})</span>}
            </div>
            <button
              onClick={() => {
                setShowAddModule(true);
                setEditingModuleId(null);
              }}
              className="flex items-center gap-1 text-xs text-[#2B55A3] hover:underline"
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
                <Loader2 size={20} className="animate-spin text-[#2B55A3]" />
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
                      <button
                        onClick={() => setSelectedModuleId(mod.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedModuleId === mod.id ? "bg-blue-50 border-l-2 border-[#2B55A3]" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedModuleId === mod.id ? "text-[#2B55A3]" : "text-gray-900"}`}>
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
                            className="p-1 text-gray-400 hover:text-[#2B55A3] rounded transition-colors"
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
                      </button>
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
                  <Video size={16} className="text-[#2B55A3]" />
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
                  className="flex items-center gap-1 text-xs text-[#2B55A3] hover:underline"
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
                      onSubmit={({ title, desc, youtube, duration }) => {
                        if (!title.trim()) { toast.error("El título es obligatorio"); return; }
                        if (!youtube.trim()) { toast.error("La URL de YouTube es obligatoria"); return; }
                        if (!duration) { toast.error("La duración es obligatoria"); return; }
                        createSessionMutation.mutate({ title: title.trim(), desc: desc.trim(), youtube: youtube.trim(), duration });
                      }}
                      onCancel={() => setShowAddSession(false)}
                      loading={createSessionMutation.isPending}
                    />
                  </div>
                )}

                {loadingSessions ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 size={20} className="animate-spin text-[#2B55A3]" />
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
                            initialYouTube={editingSession?.youtube_url ?? ""}
                            initialDuration={editingSession?.duration_minutes?.toString() ?? ""}
                            onSubmit={({ title, desc, youtube, duration }) => {
                              if (!title.trim()) { toast.error("El título es obligatorio"); return; }
                              if (!youtube.trim()) { toast.error("La URL de YouTube es obligatoria"); return; }
                              if (!duration) { toast.error("La duración es obligatoria"); return; }
                              updateSessionMutation.mutate({ sessionId: sess.id, title: title.trim(), desc: desc.trim(), youtube: youtube.trim(), duration });
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
                                  {sess.youtube_url && (
                                    <a
                                      href={sess.youtube_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#2B55A3] hover:underline flex items-center gap-0.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink size={11} />
                                      YouTube
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
                                  className="p-1 text-gray-400 hover:text-[#2B55A3] rounded transition-colors"
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
                                    className="text-xs text-[#2B55A3] hover:underline flex items-center gap-0.5"
                                  >
                                    <Plus size={12} />
                                    Agregar
                                  </button>
                                </div>

                                {/* Formulario de nuevo material */}
                                {showAddMaterial[sess.id] && (
                                  <div className="p-3 border-b border-gray-100 bg-blue-50/30 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
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
                                        </select>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">URL de Google Drive *</Label>
                                      <Input
                                        value={materialUrl[sess.id] ?? ""}
                                        onChange={(e) => setMaterialUrl((prev) => ({ ...prev, [sess.id]: e.target.value }))}
                                        placeholder="https://drive.google.com/..."
                                        className="text-xs h-8"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setShowAddMaterial((prev) => ({ ...prev, [sess.id]: false }))}
                                        className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => createMaterialMutation.mutate(sess.id)}
                                        disabled={
                                          !materialName[sess.id]?.trim() ||
                                          !materialUrl[sess.id]?.trim() ||
                                          createMaterialMutation.isPending
                                        }
                                        className="text-xs px-2 py-1 bg-[#2B55A3] text-white rounded hover:bg-[#2B55A3]/90 disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {createMaterialMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                                        Guardar
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
                                        <span className="text-xs text-gray-700 flex-1 truncate">{mat.name}</span>
                                        <a
                                          href={mat.drive_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#2B55A3] hover:text-[#2B55A3]/70"
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
    </div>
  );
}
