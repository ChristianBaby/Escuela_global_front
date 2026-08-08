"use client";

import { useRef, useState, useEffect } from "react";
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
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { certificationsService } from "@/lib/services/certificates/certifications.service";
import { certificateTemplatesService } from "@/lib/services/certificates";
import { cursosService } from "@/lib/services/courses";
import type { CertificateTemplate } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

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

  const [certTemplateId, setCertTemplateId] = useState<string>("");
  const [constanciaTemplateId, setConstanciaTemplateId] = useState<string>("");
  const [templateInitialized, setTemplateInitialized] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["certifications", courseId],
    queryFn: () => certificationsService.get(courseId),
  });

  useEffect(() => {
    if (data && !templateInitialized) {
      setCertTemplateId(data.certificate_template?.id ?? "");
      setConstanciaTemplateId(data.constancia_template?.id ?? "");
      setTemplateInitialized(true);
    }
  }, [data, templateInitialized]);

  const { data: plantillas } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: certificateTemplatesService.list,
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
        vars.type === "Certificado" ? certTemplateId : constanciaTemplateId;
      if (!templateId) {
        throw new Error(
          vars.type === "Certificado"
            ? "Este curso no tiene una plantilla de certificado asignada. Configúrala en Editar curso."
            : "Este curso no tiene una plantilla de constancia asignada. Configúrala en Editar curso."
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

  // ── Save templates ────────────────────────────────────────────────────────
  const saveTemplatesMutation = useMutation({
    mutationFn: () =>
      cursosService.update(courseId, {
        certificate_template_id: certTemplateId || null,
        constancia_template_id: constanciaTemplateId || null,
      }),
    onSuccess: () => {
      toast.success("Plantillas actualizadas");
      queryClient.invalidateQueries({ queryKey: ["certifications", courseId] });
    },
    onError: () => toast.error("Error al actualizar las plantillas"),
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCertTemplate = plantillas?.find((t) => t.id === certTemplateId);
  const selectedConstanciaTemplate = plantillas?.find((t) => t.id === constanciaTemplateId);

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

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Certificado
              </span>
              <select
                value={certTemplateId}
                onChange={(e) => setCertTemplateId(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#084D95]/20 bg-white"
              >
                <option value="">Sin plantilla</option>
                {plantillas?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Constancia
              </span>
              <select
                value={constanciaTemplateId}
                onChange={(e) => setConstanciaTemplateId(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#084D95]/20 bg-white"
              >
                <option value="">Sin plantilla</option>
                {plantillas?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => saveTemplatesMutation.mutate()}
              disabled={saveTemplatesMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50 transition-colors"
            >
              {saveTemplatesMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Guardar plantillas
            </button>
          </div>
        </div>

        {/* Vista previa de plantillas */}
        {(selectedCertTemplate || selectedConstanciaTemplate) && (
          <div
            className={`grid gap-4 pt-2 border-t border-gray-100 ${
              selectedCertTemplate && selectedConstanciaTemplate
                ? "grid-cols-2"
                : "grid-cols-1 max-w-sm"
            }`}
          >
            {selectedCertTemplate && (
              <TemplatePreview
                template={selectedCertTemplate}
                label="Certificado"
                labelColor="#059669"
              />
            )}
            {selectedConstanciaTemplate && (
              <TemplatePreview
                template={selectedConstanciaTemplate}
                label="Constancia"
                labelColor="#D97706"
              />
            )}
          </div>
        )}
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
                    <span className="block truncate max-w-[100px]">
                      {m.title.length > 12
                        ? m.title.slice(0, 12) + "…"
                        : m.title}
                    </span>
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
                        return (
                          <td key={m.id} className="px-3 py-3.5 text-center">
                            {grade !== undefined ? (
                              <span
                                className={`font-medium ${
                                  grade >= 14
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                              >
                                {grade}
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

// ── TemplatePreview ───────────────────────────────────────────────────────────
const CERT_W = 3508;
const CERT_H = 2480;

function TemplatePreview({
  template,
  label,
  labelColor,
}: {
  template: CertificateTemplate;
  label: string;
  labelColor: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width)
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scale = containerWidth > 0 ? containerWidth / CERT_W : 0;
  const namePos = template.student_name_position;
  const qrPos = template.qr_position;
  const fontSize = scale > 0 ? Math.max(6, (template.font_sizes?.student_name ?? 200) * scale) : 12;
  const qrPx = scale > 0 ? Math.max(12, (template.qr_size ?? 300) * scale) : 24;
  const bgUrl = resolveUrl(template.background_image_url);
  const backUrl = template.back_image_url ? resolveUrl(template.back_image_url) : "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{ backgroundColor: `${labelColor}18`, color: labelColor }}
        >
          {label}
        </span>
        <span className="text-xs text-gray-400 truncate">{template.name}</span>
      </div>
      <div className="space-y-2">
        {/* Cara (portada) */}
        <div
          ref={containerRef}
          className="relative w-full rounded-lg overflow-hidden border border-gray-200"
          style={{ aspectRatio: `${CERT_W}/${CERT_H}` }}
        >
          {bgUrl ? (
            <img
              src={bgUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-fill"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
          <div
            style={{
              position: "absolute",
              left: `${(namePos.x / CERT_W) * 100}%`,
              top: `${(namePos.y / CERT_H) * 100}%`,
              transform: "translate(-50%, -50%)",
              fontSize,
              fontFamily: template.font_family,
              color: "#084D95",
              whiteSpace: "nowrap",
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            Nombre del Estudiante
          </div>
          <span className="absolute top-1 left-1 text-[9px] bg-black/40 text-white px-1.5 py-0.5 rounded">
            Cara
          </span>
        </div>

        {/* Contraportada */}
        <div
          className="relative w-full rounded-lg overflow-hidden border border-gray-200"
          style={{ aspectRatio: `${CERT_W}/${CERT_H}` }}
        >
          {backUrl ? (
            <img
              src={backUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-fill"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-400">Sin contraportada</span>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: `${(qrPos.x / CERT_W) * 100}%`,
              top: `${(qrPos.y / CERT_H) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: qrPx,
              height: qrPx,
              border: "2px dashed #805AD5",
              backgroundColor: "#805AD522",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: Math.max(6, qrPx * 0.2),
                color: "#805AD5",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              QR
            </span>
          </div>
          <span className="absolute top-1 left-1 text-[9px] bg-black/40 text-white px-1.5 py-0.5 rounded">
            Contraportada
          </span>
        </div>
      </div>
    </div>
  );
}
