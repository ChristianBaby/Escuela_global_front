"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Upload,
  Award,
  FileCheck,
  Loader2,
  CheckCircle,
  ChevronDown,
  Pencil,
  Plus,
} from "lucide-react";
import { certificationsService } from "@/lib/services/certificates/certifications.service";

// ── Helpers ────────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function CertificacionesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const queryClient = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["certifications", courseId],
    queryFn: () => certificationsService.get(courseId),
  });

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportMutation = useMutation({
    mutationFn: () => certificationsService.exportExcel(courseId),
    onSuccess: (blob) => {
      downloadBlob(blob, `certificaciones-${courseId}.xlsx`);
      toast.success("Excel exportado correctamente");
    },
    onError: () => toast.error("Error al exportar el Excel"),
  });

  // ── Import Excel ──────────────────────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: (file: File) => certificationsService.importGrades(courseId, file),
    onSuccess: (res) => {
      toast.success(`Notas importadas: ${res.processed} estudiantes procesados`);
      queryClient.invalidateQueries({ queryKey: ["certifications", courseId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg ?? "Error al importar el Excel");
    },
  });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importMutation.mutate(file);
    e.target.value = "";
  };

  // ── Emit certificate / constancia ──────────────────────────────────────────
  const emitMutation = useMutation({
    mutationFn: (vars: {
      enrollment_id: string;
      type: "Certificado" | "Constancia";
    }) => {
      const templateId =
        vars.type === "Certificado"
          ? data?.certificate_template?.id
          : data?.constancia_template?.id;
      if (!templateId) {
        throw new Error(
          vars.type === "Certificado"
            ? "Este curso no tiene una plantilla de certificado asignada. Créala arriba."
            : "Este curso no tiene una plantilla de constancia asignada. Créala arriba."
        );
      }
      return certificationsService.emit(courseId, {
        enrollment_id: vars.enrollment_id,
        type: vars.type,
        template_id: templateId,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(
        `${vars.type} asignado correctamente`
      );
      queryClient.invalidateQueries({ queryKey: ["certifications", courseId] });
    },
    onError: (err: unknown) => {
      const raw = err as Error & { response?: { data?: { message?: string } } };
      toast.error(raw.message ?? raw.response?.data?.message ?? "Error al emitir");
    },
  });

  const removeEmitMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      certificationsService.removeEmit(courseId, enrollmentId),
    onSuccess: () => {
      toast.success("Certificado eliminado");
      queryClient.invalidateQueries({ queryKey: ["certifications", courseId] });
    },
    onError: () => toast.error("Error al eliminar"),
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = data
    ? {
        total: data.students.length,
        conCertificado: data.students.filter(
          (s) => s.certificate_type === "Certificado"
        ).length,
        conConstancia: data.students.filter(
          (s) => s.certificate_type === "Constancia"
        ).length,
        sinAsignar: data.students.filter((s) => !s.certificate_type).length,
        conNotas: data.students.filter((s) => s.average_grade !== null).length,
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#084D95]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Error al cargar el módulo de certificaciones.{" "}
        <Link href="/panel/soporte/cursos" className="text-[#084D95] hover:underline">
          Volver a cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href="/panel/soporte/cursos"
          className="text-gray-400 hover:text-gray-700 transition-colors mt-1"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-primary">Certificaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5 truncate max-w-xl">
            {data.course_title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Exportar */}
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {exportMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Exportar Excel
          </button>

          {/* Importar */}
          <button
            onClick={() => importRef.current?.click()}
            disabled={importMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {importMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Importar Notas
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />

        </div>
      </div>

      {/* ── Plantilla y modo ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Modo:</span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                data.certification_mode === "manual"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
              }`}
            >
              {data.certification_mode === "manual"
                ? "Manual con notas"
                : "Automático"}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Certificado
              </span>
              <Link
                href={`/panel/soporte/certificados/plantillas?course_id=${courseId}&kind=certificado${
                  data.certificate_template ? `&template_id=${data.certificate_template.id}` : ""
                }`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {data.certificate_template ? <Pencil size={11} /> : <Plus size={11} />}
                {data.certificate_template?.name ?? "Crear plantilla"}
              </Link>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Constancia
              </span>
              <Link
                href={`/panel/soporte/certificados/plantillas?course_id=${courseId}&kind=constancia${
                  data.constancia_template ? `&template_id=${data.constancia_template.id}` : ""
                }`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {data.constancia_template ? <Pencil size={11} /> : <Plus size={11} />}
                {data.constancia_template?.name ?? "Crear plantilla"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Con notas", value: stats.conNotas, color: "text-blue-600" },
            { label: "Certificados", value: stats.conCertificado, color: "text-emerald-600" },
            { label: "Constancias", value: stats.conConstancia, color: "text-amber-600" },
            { label: "Sin asignar", value: stats.sinAsignar, color: "text-gray-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-200 p-3 text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabla de estudiantes ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estudiante
                </th>
                {data.modules.map((m) => (
                  <th
                    key={m.id}
                    className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap max-w-[120px]"
                    title={m.title}
                  >
                    <span className="block truncate max-w-[100px] normal-case font-medium text-gray-700 mb-1">
                      {m.title.length > 12
                        ? m.title.slice(0, 12) + "…"
                        : m.title}
                    </span>
                    <Link
                      href={`/panel/soporte/certificados/plantillas?module_id=${m.id}&course_id=${courseId}${
                        m.certificate_template ? `&template_id=${m.certificate_template.id}` : ""
                      }`}
                      className="inline-flex items-center gap-0.5 text-[10px] font-normal normal-case text-gray-400 hover:text-[#084D95]"
                      title={m.certificate_template ? `Editar plantilla: ${m.certificate_template.name}` : "Crear plantilla de este módulo"}
                    >
                      {m.certificate_template ? <Pencil size={9} /> : <Plus size={9} />}
                      Plantilla
                    </Link>
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Promedio
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  Certificado
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  Constancia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.students.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.modules.length + 4}
                    className="text-center py-12 text-gray-400"
                  >
                    <Award size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      No hay estudiantes matriculados en este curso
                    </p>
                  </td>
                </tr>
              ) : (
                data.students.map((student) => {
                  const isCert = student.certificate_type === "Certificado";
                  const isConst = student.certificate_type === "Constancia";
                  const avg = student.average_grade;
                  const avgOk = avg !== null && avg >= 14;

                  return (
                    <tr
                      key={student.enrollment_id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Nombre */}
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </td>

                      {/* Notas por módulo */}
                      {data.modules.map((m) => {
                        const grade = student.module_grades[m.id];
                        const hasModuleCert = !!student.module_certificates[m.id];
                        return (
                          <td key={m.id} className="px-3 py-3.5 text-center">
                            {grade !== undefined ? (
                              <span className="inline-flex items-center gap-1">
                                <span
                                  className={`font-medium ${
                                    grade >= 14
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {grade}
                                </span>
                                {hasModuleCert && (
                                  <Award size={11} className="text-emerald-500" aria-label="Certificado de módulo emitido" />
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Promedio */}
                      <td className="px-4 py-3.5 text-center">
                        {avg !== null ? (
                          <span
                            className={`font-semibold text-sm px-2 py-0.5 rounded-full ${
                              avgOk
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {avg}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">Sin notas</span>
                        )}
                      </td>

                      {/* Col Certificado */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => {
                            if (isCert) {
                              removeEmitMutation.mutate(student.enrollment_id);
                            } else {
                              emitMutation.mutate({
                                enrollment_id: student.enrollment_id,
                                type: "Certificado",
                              });
                            }
                          }}
                          disabled={
                            emitMutation.isPending ||
                            removeEmitMutation.isPending
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isCert
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                          title={isCert ? "Quitar certificado" : "Asignar certificado"}
                        >
                          {isCert ? (
                            <CheckCircle size={13} />
                          ) : (
                            <FileCheck size={13} />
                          )}
                          {isCert ? "Asignado" : "Asignar"}
                        </button>
                      </td>

                      {/* Col Constancia */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => {
                            if (isConst) {
                              removeEmitMutation.mutate(student.enrollment_id);
                            } else {
                              emitMutation.mutate({
                                enrollment_id: student.enrollment_id,
                                type: "Constancia",
                              });
                            }
                          }}
                          disabled={
                            emitMutation.isPending ||
                            removeEmitMutation.isPending
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isConst
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                          }`}
                          title={isConst ? "Quitar constancia" : "Asignar constancia"}
                        >
                          {isConst ? (
                            <CheckCircle size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )}
                          {isConst ? "Asignada" : "Asignar"}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

