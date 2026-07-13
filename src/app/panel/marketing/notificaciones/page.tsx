"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  notificacionesMktService,
  type SendNotificationDto,
  type NotificationRecipient,
} from "@/lib/services/marketing";
import { cursosService } from "@/lib/services/courses";
import { categoriasService } from "@/lib/services/categories";
import { toast } from "sonner";
import { Bell, Send, Users, BookOpen, UserCheck, Search, X, Tag, Percent, Megaphone, Clock } from "lucide-react";

const TIPOS = [
  { value: "nuevo_curso", label: "Nuevo curso", icon: BookOpen },
  { value: "descuento", label: "Descuento", icon: Percent },
  { value: "anuncio", label: "Anuncio", icon: Megaphone },
  { value: "recordatorio", label: "Recordatorio", icon: Clock },
] as const;

type TipoNotificacion = (typeof TIPOS)[number]["value"];

const AUDIENCIAS = [
  {
    value: "all",
    label: "Todos los estudiantes",
    description: "Se enviará a todos los estudiantes activos de la plataforma.",
    icon: Users,
  },
  {
    value: "course",
    label: "Estudiantes de un curso",
    description: "Solo a los estudiantes matriculados en el curso seleccionado.",
    icon: BookOpen,
  },
  {
    value: "users",
    label: "Usuarios específicos",
    description: "Selecciona manualmente a los destinatarios.",
    icon: UserCheck,
  },
] as const;

type Audiencia = (typeof AUDIENCIAS)[number]["value"];

// Con ~16 mil estudiantes, la búsqueda libre no basta: se puede acotar primero por curso o categoría.
const FILTROS = [
  { value: "search", label: "Nombre o correo", icon: Search },
  { value: "course", label: "Por curso", icon: BookOpen },
  { value: "category", label: "Por categoría", icon: Tag },
] as const;

type FiltroModo = (typeof FILTROS)[number]["value"];

const empty = {
  title: "",
  body: "",
  redirect_url: "",
  audience: "all" as Audiencia,
  type: "nuevo_curso" as TipoNotificacion,
  course_id: "",
};

export default function NotificacionesMarketingPage() {
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<NotificationRecipient[]>([]);
  const [filtroModo, setFiltroModo] = useState<FiltroModo>("search");
  const [filtroCourseId, setFiltroCourseId] = useState("");
  const [filtroCategoryId, setFiltroCategoryId] = useState("");

  // Debounce de la búsqueda de usuarios
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: cursosData } = useQuery({
    queryKey: ["cursos-notif"],
    queryFn: () => cursosService.list({ status: "published", limit: 100 }),
    enabled: form.audience === "course" || (form.audience === "users" && filtroModo === "course"),
  });

  const { data: categoriasData } = useQuery({
    queryKey: ["categorias-notif"],
    queryFn: categoriasService.list,
    enabled: form.audience === "users" && filtroModo === "category",
  });

  const recipientsEnabled =
    form.audience === "users" &&
    (filtroModo === "search" || (filtroModo === "course" && !!filtroCourseId) || (filtroModo === "category" && !!filtroCategoryId));

  const { data: recipients = [], isLoading: loadingRecipients } = useQuery({
    queryKey: ["notif-recipients", debouncedSearch, filtroModo, filtroCourseId, filtroCategoryId],
    queryFn: () =>
      notificacionesMktService.getRecipients({
        search: debouncedSearch || undefined,
        course_id: filtroModo === "course" ? filtroCourseId : undefined,
        category_id: filtroModo === "category" ? filtroCategoryId : undefined,
      }),
    enabled: recipientsEnabled,
  });

  const recipientsOrdenados = [...recipients].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "es", { sensitivity: "base" })
  );

  const sendMutation = useMutation({
    mutationFn: notificacionesMktService.send,
    onSuccess: (data) => {
      toast.success(`Notificación enviada a ${data.sent} usuario${data.sent === 1 ? "" : "s"}`);
      setForm(empty);
      setSelectedUsers([]);
      setSearch("");
      setFiltroModo("search");
      setFiltroCourseId("");
      setFiltroCategoryId("");
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al enviar la notificación"),
  });

  const toggleUser = (user: NotificationRecipient) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Completa el título y el mensaje");
      return;
    }
    if (form.audience === "course" && !form.course_id) {
      toast.error("Selecciona un curso");
      return;
    }
    if (form.audience === "users" && selectedUsers.length === 0) {
      toast.error("Selecciona al menos un usuario");
      return;
    }

    const dto: SendNotificationDto = {
      title: form.title.trim(),
      body: form.body.trim(),
      redirect_url: form.redirect_url.trim() || undefined,
      audience: form.audience,
      type: form.type,
      ...(form.audience === "course" && { course_id: form.course_id }),
      ...(form.audience === "users" && { user_ids: selectedUsers.map((u) => u.id) }),
    };

    sendMutation.mutate(dto);
  };

  return (
    <div className="max-w-3xl">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-1">
        <Bell size={22} className="text-[#084D95]" />
        <h1 className="text-2xl font-bold text-brand-primary">Notificaciones</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Envía un mensaje personalizado a tus estudiantes. Aparecerá en su centro de notificaciones.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Título */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Título *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            placeholder="Ej: ¡Nuevo descuento disponible!"
            maxLength={150}
          />
        </div>

        {/* Mensaje */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Mensaje *</label>
          <textarea
            rows={3}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30 resize-none"
            placeholder="Escribe el contenido del mensaje..."
            maxLength={500}
          />
        </div>

        {/* Link de redirección */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Link de redirección <span className="text-xs text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            value={form.redirect_url}
            onChange={(e) => setForm({ ...form, redirect_url: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            placeholder="/cursos/nombre-del-curso"
          />
        </div>

        {/* Tipo de notificación */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tipo de notificación</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  form.type === t.value
                    ? "border-[#084D95] bg-[#084D95]/5 text-[#084D95]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <t.icon size={16} className={form.type === t.value ? "text-[#084D95]" : "text-gray-400"} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Audiencia */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Audiencia</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {AUDIENCIAS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setForm({ ...form, audience: a.value })}
                className={`text-left p-4 rounded-xl border transition-all ${
                  form.audience === a.value
                    ? "border-[#084D95] bg-[#084D95]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <a.icon
                  size={18}
                  className={form.audience === a.value ? "text-[#084D95]" : "text-gray-400"}
                />
                <p className={`text-sm font-semibold mt-2 ${form.audience === a.value ? "text-[#084D95]" : "text-gray-800"}`}>
                  {a.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de curso */}
        {form.audience === "course" && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Curso *</label>
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            >
              <option value="">Selecciona un curso...</option>
              {cursosData?.data.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Selector de usuarios específicos */}
        {form.audience === "users" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Usuarios *</label>

            {/* Chips de seleccionados */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1.5 bg-[#084D95]/10 text-[#084D95] text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {u.first_name} {u.last_name}
                    <button type="button" onClick={() => toggleUser(u)} className="hover:text-[#084D95]/70">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Modo de filtro: con ~16 mil estudiantes conviene acotar antes de buscar por nombre */}
            <div className="flex gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFiltroModo(f.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filtroModo === f.value
                      ? "border-[#084D95] bg-[#084D95]/5 text-[#084D95]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <f.icon size={13} />
                  {f.label}
                </button>
              ))}
            </div>

            {/* Acotar por curso */}
            {filtroModo === "course" && (
              <select
                value={filtroCourseId}
                onChange={(e) => setFiltroCourseId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
              >
                <option value="">Selecciona un curso...</option>
                {cursosData?.data.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}

            {/* Acotar por categoría */}
            {filtroModo === "category" && (
              <select
                value={filtroCategoryId}
                onChange={(e) => setFiltroCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
              >
                <option value="">Selecciona una categoría...</option>
                {categoriasData?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Búsqueda por nombre o correo, se combina con el filtro elegido arriba */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                placeholder="Buscar por nombre o correo..."
              />
            </div>

            {/* Resultados */}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {!recipientsEnabled ? (
                <p className="text-center text-sm text-gray-400 py-4">
                  {filtroModo === "course" ? "Selecciona un curso para ver estudiantes" : "Selecciona una categoría para ver estudiantes"}
                </p>
              ) : loadingRecipients ? (
                <p className="text-center text-sm text-gray-400 py-4">Buscando...</p>
              ) : recipientsOrdenados.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">Sin resultados</p>
              ) : (
                recipientsOrdenados.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedUsers.some((s) => s.id === u.id)}
                      onChange={() => toggleUser(u)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900 truncate">
                      {u.first_name} {u.last_name}
                      <span className="text-gray-400"> · {u.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-400">{selectedUsers.length} usuario{selectedUsers.length === 1 ? "" : "s"} seleccionado{selectedUsers.length === 1 ? "" : "s"}</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50"
          >
            <Send size={15} />
            {sendMutation.isPending ? "Enviando..." : "Enviar notificación"}
          </button>
        </div>
      </form>
    </div>
  );
}
