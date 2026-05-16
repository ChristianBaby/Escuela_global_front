"use client";

import { useQuery } from "@tanstack/react-query";
import { studentService } from "@/lib/services/student";
import { Award, Download, ExternalLink, Loader2, Share2 } from "lucide-react";
import Link from "next/link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function MisCertificadosPage() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ["mis-certificados"],
    queryFn: () => studentService.getMyCertificates(),
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis certificados</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Descarga y comparte los certificados de los cursos que has completado.
        </p>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#2B55A3]" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!certificates || certificates.length === 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-full bg-[#2B55A3]/10 flex items-center justify-center mb-4">
            <Award size={32} className="text-[#2B55A3]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Aún no están disponibles
          </h2>
          <p className="text-gray-500 text-sm max-w-sm">
            Completa un curso al 100% y deja tu reseña para obtener tu certificado de finalización.
          </p>
          <Link
            href="/mis-cursos"
            className="mt-6 inline-block bg-[#2B55A3] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
          >
            Ver mis cursos
          </Link>
        </div>
      )}

      {/* Lista de certificados */}
      {!isLoading && certificates && certificates.length > 0 && (
        <div className="grid gap-4">
          {certificates.map((cert) => {
            const verifyUrl = `/verificar/${cert.verification_code}`;
            const shareUrl = typeof window !== "undefined"
              ? `${window.location.origin}${verifyUrl}`
              : verifyUrl;

            return (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[#2B55A3]/30 transition-colors"
              >
                {/* Icono */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B55A3] to-[#3FB1E5] flex items-center justify-center">
                  <Award size={24} className="text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{cert.course_title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Emitido el {formatDate(cert.issued_at)}</p>
                  <p className="font-mono text-xs text-gray-500 mt-1 truncate">
                    {cert.verification_code}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/certificado/${cert.enrollment_id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={13} />
                    Ver
                  </Link>

                  {cert.pdf_url ? (
                    <a
                      href={cert.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2B55A3] text-white text-xs font-medium hover:bg-[#2B55A3]/90 transition-colors"
                    >
                      <Download size={13} />
                      PDF
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium cursor-not-allowed">
                      <Download size={13} />
                      PDF
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Certificado — ${cert.course_title}`,
                          text: `Completé el curso "${cert.course_title}" en Escuela Global.`,
                          url: shareUrl,
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Compartir"
                  >
                    <Share2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
