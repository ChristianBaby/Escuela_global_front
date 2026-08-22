"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { studentService } from "@/lib/services/student";
import {
  Award, Download, Share2, CheckCircle2, Loader2, AlertCircle, ExternalLink, FileText,
} from "lucide-react";
import Link from "next/link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function CertificadoModuloPage() {
  const { id } = useParams<{ id: string }>();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ["certificado-modulo", id],
    queryFn: () => studentService.getMyModuleCertificate(id),
    enabled: !!id,
    retry: false,
  });

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (!cert?.id) return;
    let objectUrl: string | null = null;
    setLoadingPdf(true);

    studentService
      .downloadModuleCertificate(cert.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      })
      .catch(() => {})
      .finally(() => setLoadingPdf(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cert?.id]);

  function handleDownload() {
    if (!pdfBlobUrl || !cert) return;
    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = `certificado-modulo-${cert.course_title}.pdf`;
    a.click();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#084D95]" />
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Certificado no disponible</h2>
        <p className="text-gray-500 text-sm mb-6">
          Este certificado de módulo no está disponible.
        </p>
        <Link
          href="/mis-certificados"
          className="inline-block bg-[#084D95] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
        >
          Volver a mis certificados
        </Link>
      </div>
    );
  }

  const verifyUrl = cert.verification_code ? `/verificar/${cert.verification_code}` : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award size={16} className="text-[#084D95]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#084D95]">
            Certificado de módulo
          </p>
        </div>
        <h1 className="text-2xl font-bold text-brand-primary">{cert.module_title}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {cert.course_title} · {cert.student_name} · Emitido el {formatDate(cert.issued_at)}
        </p>
      </div>

      {/* PDF viewer */}
      {pdfBlobUrl ? (
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
          <iframe
            src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full"
            style={{ height: "560px" }}
            title="Certificado PDF"
          />
        </div>
      ) : (
        <div
          className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3"
          style={{ height: "280px" }}
        >
          {loadingPdf ? (
            <>
              <Loader2 size={32} className="animate-spin text-[#084D95]" />
              <p className="text-sm text-gray-500">Generando certificado...</p>
            </>
          ) : (
            <>
              <FileText size={40} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No se pudo cargar el PDF</p>
            </>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownload}
          disabled={!pdfBlobUrl || loadingPdf}
          className="flex-1 flex items-center justify-center gap-2 bg-[#084D95] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#084D95]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingPdf ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {loadingPdf ? "Generando PDF..." : "Descargar PDF"}
        </button>

        {verifyUrl && (
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}${verifyUrl}`;
              if (navigator.share) {
                navigator.share({
                  title: `Certificado de módulo — ${cert.module_title}`,
                  text: `Completé el módulo "${cert.module_title}" del curso "${cert.course_title}" en Escuela Global.`,
                  url: shareUrl,
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
                alert("Enlace de verificación copiado al portapapeles.");
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Share2 size={16} />
            Compartir
          </button>
        )}
      </div>

      {/* Datos del certificado */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Módulo</span>
          <span className="font-medium text-gray-800 text-right max-w-xs truncate">{cert.module_title}</span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Curso</span>
          <span className="font-medium text-gray-800 text-right max-w-xs truncate">{cert.course_title}</span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Estudiante</span>
          <span className="font-medium text-gray-800">{cert.student_name}</span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Fecha de emisión</span>
          <span className="font-medium text-gray-800">{formatDate(cert.issued_at)}</span>
        </div>
        {verifyUrl && (
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="font-mono text-xs text-gray-500 tracking-wider">
                {cert.verification_code}
              </span>
            </div>
            <Link
              href={verifyUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-[#084D95] hover:underline"
            >
              Verificar autenticidad
              <ExternalLink size={11} />
            </Link>
          </div>
        )}
      </div>

      <Link
        href="/mis-certificados"
        className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Ver todos mis certificados
      </Link>
    </div>
  );
}
