"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { studentService } from "@/lib/services/student";
import {
  Award, Download, Share2, CheckCircle2, Loader2, AlertCircle, ExternalLink,
} from "lucide-react";
import Link from "next/link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h} horas`;
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
          href="/mis-cursos"
          className="inline-block bg-[#2B55A3] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
        >
          Volver a mis cursos
        </Link>
      </div>
    );
  }

  const studentName = `${cert.student.first_name} ${cert.student.last_name}`;
  const courseName = cert.enrollment.course.title;
  const issuedDate = formatDate(cert.issued_at);
  const enrolledDate = formatDate(cert.enrollment.enrolled_at);
  const completedDate = formatDate(cert.enrollment.completed_at);
  const duration = formatHours(cert.enrollment.course.total_duration_minutes);
  const verifyUrl = `/verificar/${cert.verification_code}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi certificado</h1>
        <p className="text-gray-500 mt-1">Descarga y comparte tu logro.</p>
      </div>

      {/* Certificado card */}
      <div className="bg-white rounded-2xl border-2 border-[#2B55A3]/20 overflow-hidden shadow-sm">
        {/* Banda superior */}
        <div className="bg-gradient-to-r from-[#2B55A3] to-[#3FB1E5] px-8 py-6 text-white text-center">
          <Award size={48} className="mx-auto mb-3 opacity-90" />
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">Certificado de Finalización</p>
          <h2 className="text-2xl font-bold mt-1">Escuela Global</h2>
        </div>

        {/* Cuerpo */}
        <div className="px-8 py-8 text-center">
          <p className="text-gray-500 text-sm mb-2">Este certificado acredita que</p>
          <p className="text-3xl font-bold text-gray-900 mb-4">{studentName}</p>
          <p className="text-gray-500 text-sm mb-2">completó satisfactoriamente el curso</p>
          <p className="text-xl font-semibold text-[#2B55A3] mb-6">{courseName}</p>

          {/* Datos del curso */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Inicio</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{enrolledDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Finalización</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{completedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Duración</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{duration}</p>
            </div>
          </div>

          {/* Código de verificación */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Código de verificación
              </p>
            </div>
            <p className="font-mono text-sm font-bold text-gray-800 tracking-wider">
              {cert.verification_code}
            </p>
            <Link
              href={verifyUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-[#2B55A3] hover:underline mt-2"
            >
              Verificar autenticidad
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>

        {/* Emitido */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-400">Emitido el {issuedDate}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        {cert.pdf_url ? (
          <a
            href={cert.pdf_url}
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
            if (navigator.share) {
              navigator.share({
                title: `Certificado — ${courseName}`,
                text: `Completé el curso "${courseName}" en Escuela Global.`,
                url: `${window.location.origin}${verifyUrl}`,
              });
            } else {
              navigator.clipboard.writeText(`${window.location.origin}${verifyUrl}`);
              alert("Enlace de verificación copiado al portapapeles.");
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </button>
      </div>

      <Link
        href="/mis-cursos?tab=completados"
        className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Ver todos mis certificados
      </Link>
    </div>
  );
}
