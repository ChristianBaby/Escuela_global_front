"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  notificacionesMktService,
  type SendNotificationDto,
  type NotificationRecipient,
} from "@/lib/services/marketing";
import { cursosService } from "@/lib/services/courses";
import { toast } from "sonner";
import { Bell, Send, Users, BookOpen, UserCheck, Search, X } from "lucide-react";

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

const empty = {
  title: "",
  body: "",
  redirect_url: "",
  audience: "all" as Audiencia,
  course_id: "",
};

export default function NotificacionesMarketingPage() {
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<NotificationRecipient[]>([]);

  // Debounce de la búsqueda de usuarios
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: cursosData } = useQuery({
    queryKey: ["cursos-notif"],
    queryFn: () => cursosService.list({ status: "published", limit: 100 }),
    enabled: form.audience === "course",
  });

  const { data: recipients = [], isLoading: loadingRecipients } = useQuery({
    queryKey: ["notif-recipients", debouncedSearch],
    queryFn: () => notificacionesMktService.getRecipients({ search: debouncedSearch }),
    enabled: form.audience === "users",
  });

  const sendMutation = useMutation({
    mutationFn: notificacionesMktService.send,
    onSuccess: (data) => {
      toast.success(`Notificación enviada a ${data.sent} usuario${data.sent === 1 ? "" : "s"}`);
      setForm(empty);
      setSelectedUsers([]);
      setSearch("");
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
      ...(form.audience === "course" && { course_id: form.course_id }),
      ...(form.audience === "users" && { user_ids: selectedUsers.map((u) => u.id) }),
    };

    sendMutation.mutate(dto);
  };

  return (
    <div className="max-w-3xl">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-1">
        <Bell size={22} className="text-[#2B55A3]" />
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30 resize-none"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
            placeholder="/cursos/nombre-del-curso"
          />
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
                    ? "border-[#2B55A3] bg-[#2B55A3]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <a.icon
                  size={18}
                  className={form.audience === a.value ? "text-[#2B55A3]" : "text-gray-400"}
                />
                <p className={`text-sm font-semibold mt-2 ${form.audience === a.value ? "text-[#2B55A3]" : "text-gray-800"}`}>
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
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
                    className="flex items-center gap-1.5 bg-[#2B55A3]/10 text-[#2B55A3] text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {u.first_name} {u.last_name}
                    <button type="button" onClick={() => toggleUser(u)} className="hover:text-[#2B55A3]/70">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Búsqueda */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                placeholder="Buscar por nombre o correo..."
              />
            </div>

            {/* Resultados */}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {loadingRecipients ? (
                <p className="text-center text-sm text-gray-400 py-4">Buscando...</p>
              ) : recipients.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">Sin resultados</p>
              ) : (
                recipients.map((u) => (
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
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50"
          >
            <Send size={15} />
            {sendMutation.isPending ? "Enviando..." : "Enviar notificación"}
          </button>
        </div>
      </form>
    </div>
  );
}
