"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicLayout } from "@/components/templates";
import { certificateVerifyService } from "@/lib/services/certificates";
import type { CertificateTemplateData } from "@/lib/services/certificates/certificate-verify.service";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Share2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const CERT_W = 3508;
const CERT_H = 2480;

function mapCssFont(fontFamily: string): string {
  const lower = (fontFamily ?? "").toLowerCase();
  if (lower.includes("bold")) return "'Helvetica Neue', Helvetica, Arial, sans-serif";
  if (lower.includes("times") || lower.includes("georgia") || lower.includes("serif"))
    return "Georgia, 'Times New Roman', Times, serif";
  if (lower.includes("courier") || lower.includes("mono"))
    return "'Courier New', Courier, monospace";
  return "'Helvetica Neue', Helvetica, Arial, sans-serif";
}

function isBoldFont(fontFamily: string): boolean {
  return (fontFamily ?? "").toLowerCase().includes("bold");
}

function CertificatePreview({
  template,
  studentName,
  verificationCode,
  side,
}: {
  template: CertificateTemplateData;
  studentName: string;
  verificationCode: string;
  side: "front" | "back";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (side !== "back") return;
    const verifyUrl = `${window.location.origin}/verificar/${verificationCode}`;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(verifyUrl, {
        width: 400,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    });
  }, [side, verificationCode]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const bgUrl = side === "front" ? template.background_image_url : template.back_image_url;

  if (!bgUrl) return null;

  const scale = containerWidth / CERT_W;
  const containerHeight = CERT_H * scale;
  const namePos = template.student_name_position;
  const qrPos = template.qr_position;
  const rawFontSize = template.font_sizes?.student_name ?? 200;
  const fontSize = rawFontSize * scale;
  const qrSize = template.qr_size * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: `${CERT_W} / ${CERT_H}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgUrl}
        alt={side === "front" ? "Certificado - Cara frontal" : "Certificado - Contraportada"}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {side === "front" && containerWidth > 0 && (
        <span
          className="absolute whitespace-nowrap select-none pointer-events-none"
          style={{
            left: `${namePos.x * scale}px`,
            top: `${namePos.y * scale}px`,
            transform: "translate(-50%, -50%)",
            fontSize: `${fontSize}px`,
            fontFamily: mapCssFont(template.font_family),
            fontWeight: isBoldFont(template.font_family) ? 700 : 400,
            color: "#141414",
            lineHeight: 1,
          }}
        >
          {studentName}
        </span>
      )}

      {side === "back" && qrDataUrl && containerWidth > 0 && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={qrDataUrl}
          alt="Código QR de verificación"
          className="absolute pointer-events-none"
          style={{
            left: `${qrPos.x * scale - qrSize / 2}px`,
            top: `${qrPos.y * scale - qrSize / 2}px`,
            width: `${qrSize}px`,
            height: `${qrSize}px`,
          }}
          draggable={false}
        />
      )}
    </div>
  );
}

export default function VerificarCertificadoPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [side, setSide] = useState<"front" | "back">("front");

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ["verify-certificate", uuid],
    queryFn: () => certificateVerifyService.verify(uuid),
    enabled: !!uuid,
    retry: false,
  });

  const hasBack = !!cert?.template?.back_image_url;

  return (
    <PublicLayout>
      <div className="min-h-[80vh] bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 size={36} className="animate-spin text-[#084D95]" />
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
                className="inline-block bg-[#084D95] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
              >
                Ir al inicio
              </Link>
            </div>
          )}

          {cert && (
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
                  <p className="text-emerald-700 text-sm truncate">
                    {cert.scope === "module"
                      ? `Certifica: Módulo — ${cert.module_title}`
                      : `Certifica: Curso completo — ${cert.course_title}`}
                  </p>
                  <p className="text-emerald-600 text-xs truncate">
                    Verificado por Escuela Global ·{" "}
                    <span className="font-mono">
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
                    {cert.total_hours !== null ? `${cert.total_hours} horas` : "—"}
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

              {/* Vista previa del certificado */}
              {cert.template ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                  <CertificatePreview
                    template={cert.template}
                    studentName={cert.student_name}
                    verificationCode={cert.verification_code}
                    side={side}
                  />
                </div>
              ) : (
                <div
                  className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3"
                  style={{ height: "260px" }}
                >
                  <ShieldCheck size={40} className="text-emerald-300" />
                  <p className="text-sm text-gray-500">
                    Este certificado ha sido verificado como auténtico
                  </p>
                </div>
              )}

              {/* Navegación cara/contraportada */}
              {hasBack && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSide("front")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      side === "front"
                        ? "bg-[#084D95] text-white"
                        : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowLeft size={14} />
                    Cara frontal
                  </button>
                  <button
                    onClick={() => setSide("back")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      side === "back"
                        ? "bg-[#084D95] text-white"
                        : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Contraportada
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-center">
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
                  className="text-[#084D95] hover:underline font-medium"
                >
                  Escuela Global
                </Link>
                {" · "}especializacionesglobal.net
              </p>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
