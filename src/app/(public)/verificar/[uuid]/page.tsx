"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicLayout } from "@/components/templates";
import { certificateVerifyService } from "@/lib/services/certificates";
import {
  ShieldCheck,
  Download,
  AlertCircle,
  Loader2,
  FileText,
  Share2,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function resolveUrl(pdfUrl: string) {
  if (!pdfUrl || pdfUrl.startsWith("http")) return pdfUrl;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  return `${base}${pdfUrl}`;
}

export default function VerificarCertificadoPage() {
  const { uuid } = useParams<{ uuid: string }>();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ["verify-certificate", uuid],
    queryFn: () => certificateVerifyService.verify(uuid),
    enabled: !!uuid,
    retry: false,
  });

  return (
    <PublicLayout>
      <div className="min-h-[80vh] bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 size={36} className="animate-spin text-[#2B55A3]" />
              <p className="text-gray-500 text-sm">Verificando certificado...</p>
            </div>
          )}

          {isError && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
              <AlertCircle size={52} className="text-red-300 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-800 mb-2">
                Certificado no encontrado
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                El código de verificación no corresponde a ningún certificado
                registrado en Escuela Global.
              </p>
              <Link
                href="/"
                className="inline-block bg-[#2B55A3] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
              >
                Ir al inicio
              </Link>
            </div>
          )}

          {cert && (() => {
            const isPending =
              !cert.pdf_url || cert.pdf_url === "PENDIENTE_GENERACION_PDF";
            const pdfUrl = isPending ? null : resolveUrl(cert.pdf_url);

            return (
              <div className="space-y-5">
                {/* Badge de autenticidad */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-800">
                      Certificado auténtico
                    </p>
                    <p className="text-emerald-600 text-sm truncate">
                      Verificado por Escuela Global ·{" "}
                      <span className="font-mono text-xs">
                        {cert.verification_code}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Datos del certificado */}
                <div className="bg-white rounded-2xl border border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
                  <div className="px-5 py-4 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Estudiante
                    </p>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {cert.student_name}
                    </p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Programa
                    </p>
                    <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                      {cert.course_title}
                    </p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Duración
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {cert.total_hours} horas
                    </p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Emitido
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatDate(cert.issued_at)}
                    </p>
                  </div>
                </div>

                {/* PDF viewer */}
                {pdfUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full"
                      style={{ height: "560px" }}
                      title="Certificado PDF"
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3"
                    style={{ height: "260px" }}
                  >
                    <FileText size={40} className="text-gray-300" />
                    <p className="text-sm text-gray-500">PDF en procesamiento</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {pdfUrl ? (
                    <a
                      href={pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-[#2B55A3] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
                    >
                      <Download size={16} />
                      Descargar certificado en PDF
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-3.5 rounded-xl text-sm font-medium cursor-not-allowed"
                    >
                      <Download size={16} />
                      PDF en procesamiento
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) {
                        navigator.share({
                          title: `Certificado — ${cert.course_title}`,
                          text: `${cert.student_name} completó "${cert.course_title}" en Escuela Global.`,
                          url,
                        });
                      } else {
                        navigator.clipboard.writeText(url);
                        alert("Enlace copiado al portapapeles.");
                      }
                    }}
                    className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Share2 size={16} />
                    Compartir
                  </button>
                </div>

                {/* Instructores */}
                {cert.instructors.length > 0 && (
                  <p className="text-center text-xs text-gray-400">
                    {cert.instructors.length === 1 ? "Instructor:" : "Instructores:"}{" "}
                    <span className="font-medium text-gray-600">
                      {cert.instructors.join(" · ")}
                    </span>
                  </p>
                )}

                <p className="text-center text-xs text-gray-400">
                  Emitido por{" "}
                  <Link
                    href="/"
                    className="text-[#2B55A3] hover:underline font-medium"
                  >
                    Escuela Global
                  </Link>
                  {" · "}especializacionesglobal.net
                </p>
              </div>
            );
          })()}

        </div>
      </div>
    </PublicLayout>
  );
}
