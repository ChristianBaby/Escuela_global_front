"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import { dashboardService } from "@/lib/services/dashboard";
import { matriculasService } from "@/lib/services/enrollments";
import type { StudentDetailEnrollment } from "@/lib/services/dashboard/dashboard.service";

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  deleted: "Eliminado",
};

function secondsToHm(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function enrollmentStatus(e: StudentDetailEnrollment): string {
  if (e.completed_at) return "Completado";
  if (e.progress_percent > 0) return "En progreso";
  return "Sin iniciar";
}

function statusColor(e: StudentDetailEnrollment): string {
  if (e.completed_at) return "bg-green-50 text-green-700";
  if (e.progress_percent > 0) return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-500";
}

export default function StudentDetailPage() {
  const params = useParams();
  const userId = params.user_id as string;
  const queryClient = useQueryClient();

  const [unenrollTarget, setUnenrollTarget] = useState<StudentDetailEnrollment | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-student-detail", userId],
    queryFn: () => dashboardService.getStudentDetail(userId),
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: string) => matriculasService.deleteEnrollment(enrollmentId),
    onSuccess: () => {
      toast.success("Estudiante desmatriculado correctamente");
      queryClient.invalidateQueries({ queryKey: ["admin-student-detail", userId] });
      setUnenrollTarget(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al desmatricular");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        <Loader2 size={20} className="animate-spin mr-2" />
        Cargando información del estudiante...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <Link
          href="/panel/estudiantes"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          No se pudo cargar la información del estudiante.
        </div>
      </div>
    );
  }

  const { user, enrollments } = data;
  const completedCount = enrollments.filter((e) => e.completed_at).length;
  const totalHours = Math.round(
    enrollments.reduce((sum, e) => sum + e.total_watched_seconds, 0) / 3600 * 10
  ) / 10;
  const certificatesCount = enrollments.filter((e) => e.certificate).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/panel/estudiantes"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={14} /> Volver a estudiantes
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2B55A3] flex items-center justify-center text-white text-xl font-semibold shrink-0">
            {user.first_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail size={13} /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} /> {user.phone}
                </span>
              )}
              {user.country && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {user.country}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">
                {user.role}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  user.status === "active"
                    ? "bg-green-50 text-green-700"
                    : user.status === "suspended"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {STATUS_LABELS[user.status]}
              </span>
              <span className="text-xs text-gray-400">
                Registrado el {new Date(user.created_at).toLocaleDateString("es-PE")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-[#2B55A3]" />
            <p className="text-xs text-gray-500">Matrículas</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{enrollments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <p className="text-xs text-gray-500">Completados</p>
          </div>
          <p className="text-xl font-bold text-green-700">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-[#2B55A3]" />
            <p className="text-xs text-gray-500">Horas de estudio</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-[#2B55A3]" />
            <p className="text-xs text-gray-500">Certificados</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{certificatesCount}</p>
        </div>
      </div>

      {/* Enrollments table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Cursos matriculados</h3>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
            Este estudiante no tiene matrículas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Curso</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Progreso</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tiempo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Certificado</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {e.course.thumbnail_url ? (
                          <img
                            src={e.course.thumbnail_url}
                            alt=""
                            className="w-10 h-7 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-7 rounded bg-gray-100 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {e.course.title}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{e.course.level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(e.enrolled_at).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          e.enrollment_type === "online"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {e.enrollment_type === "online" ? "Online" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2B55A3] rounded-full"
                            style={{ width: `${Math.min(e.progress_percent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-10">
                          {Math.min(e.progress_percent, 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(e)}`}>
                        {enrollmentStatus(e)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {secondsToHm(e.total_watched_seconds)}
                    </td>
                    <td className="px-4 py-3">
                      {e.certificate ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              e.certificate.type === "Certificado"
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {e.certificate.type}
                          </span>
                          <Link
                            href={`/verificar/${e.certificate.verification_code}`}
                            target="_blank"
                            className="p-1 text-[#2B55A3] hover:text-[#2B55A3]/70 rounded transition-colors"
                            title="Ver certificado"
                          >
                            <Award size={13} />
                          </Link>
                        </div>
                      ) : e.completed_at && e.has_review ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                          Por emitir
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/panel/estudiantes/${userId}/cursos/${e.course_id}`}
                          className="p-1.5 text-gray-400 hover:text-[#2B55A3] rounded transition-colors"
                          title="Ver actividad"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => setUnenrollTarget(e)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Desmatricular"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unenroll confirmation modal */}
      {unenrollTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Confirmar desmatriculación</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de desmatricular a{" "}
                <span className="font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </span>{" "}
                del curso{" "}
                <span className="font-medium text-gray-900">
                  {unenrollTarget.course.title}
                </span>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700">
                  Esta acción es irreversible. Se eliminará todo el progreso, notas, reseña y
                  certificado asociados a esta matrícula.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setUnenrollTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => unenrollMutation.mutate(unenrollTarget.id)}
                disabled={unenrollMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                {unenrollMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Desmatricular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
