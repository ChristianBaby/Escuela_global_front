"use client";

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

function resolveUrl(pdfUrl: string) {
  if (!pdfUrl || pdfUrl.startsWith("http")) return pdfUrl;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  return `${base}${pdfUrl}`;
}

export default function CertificadoPage() {
  const { enrollment_id } = useParams<{ enrollment_id: string }>();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ["certificado", enrollment_id],
    queryFn: () => studentService.getMyCertificate(enrollment_id),
    enabled: !!enrollment_id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#2B55A3]" />
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Certificado no disponible</h2>
        <p className="text-gray-500 text-sm mb-6">
          El certificado aún no está generado. Asegúrate de haber completado el curso y dejado tu reseña.
        </p>
        <Link
          href="/mis-certificados"
          className="inline-block bg-[#2B55A3] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
        >
          Volver a mis certificados
        </Link>
      </div>
    );
  }

  const isPending = !cert.pdf_url || cert.pdf_url === "PENDIENTE_GENERACION_PDF";
  const pdfUrl = isPending ? null : resolveUrl(cert.pdf_url);
  const verifyUrl = `/verificar/${cert.verification_code}`;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award size={16} className="text-[#2B55A3]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2B55A3]">
            Mi certificado
          </p>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{cert.course_title}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {cert.student_name} · Emitido el {formatDate(cert.issued_at)} · {cert.total_hours} horas
        </p>
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
          style={{ height: "280px" }}
        >
          <FileText size={40} className="text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">PDF en procesamiento</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Disponible en unos instantes. Recarga la página.
            </p>
          </div>
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
            className="flex-1 flex items-center justify-center gap-2 bg-[#2B55A3] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
          >
            <Download size={16} />
            Descargar PDF
          </a>
        ) : (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-400 py-3 rounded-xl text-sm font-medium cursor-not-allowed"
          >
            <Download size={16} />
            PDF en procesamiento...
          </button>
        )}

        <button
          onClick={() => {
            const shareUrl = `${window.location.origin}${verifyUrl}`;
            if (navigator.share) {
              navigator.share({
                title: `Certificado — ${cert.course_title}`,
                text: `Completé "${cert.course_title}" en Escuela Global.`,
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
      </div>

      {/* Datos del certificado */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Programa</span>
          <span className="font-medium text-gray-800 text-right max-w-xs truncate">{cert.course_title}</span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Estudiante</span>
          <span className="font-medium text-gray-800">{cert.student_name}</span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Duración</span>
          <span className="font-medium text-gray-800">{cert.total_hours} horas</span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5 text-sm">
          <span className="text-gray-400">Fecha de emisión</span>
          <span className="font-medium text-gray-800">{formatDate(cert.issued_at)}</span>
        </div>
        {cert.instructors && cert.instructors.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 text-sm">
            <span className="text-gray-400">
              {cert.instructors.length === 1 ? "Instructor" : "Instructores"}
            </span>
            <span className="font-medium text-gray-800 text-right max-w-xs">
              {cert.instructors.join(" · ")}
            </span>
          </div>
        )}
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
            className="inline-flex items-center gap-1 text-xs text-[#2B55A3] hover:underline"
          >
            Verificar autenticidad
            <ExternalLink size={11} />
          </Link>
        </div>
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
