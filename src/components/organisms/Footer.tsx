"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Logo, Separator } from "@/components/atoms";
import { MapPin, Mail, Phone } from "lucide-react";
import { categoriasService } from "@/lib/services/categories";

const LINKS = {
  // 🚀 COLUMNA: SOPORTE
  soporte: [
    { label: "Políticas de Privacidad", href: "/institucional/politicas-de-privacidad" },
    { label: "Términos y Condiciones", href: "/institucional/terminos-y-condiciones" },
    { label: "Políticas de Reembolso", href: "/institucional/politica-de-devoluciones" },
  ],
};

export function Footer() {
  // Las 3 categorías con más alumnos matriculados — reemplazan la lista fija
  // que antes traía nombres inventados y no correspondía a categorías reales.
  const { data: topCategorias = [] } = useQuery({
    queryKey: ["footer-top-categorias"],
    queryFn: () => categoriasService.getTop(3),
    staleTime: 10 * 60_000,
  });

  return (
    <footer className="bg-[#022A5D] text-white">
      {/* El fondo ocupa todo el ancho, pero el contenido tiene un tope generoso
          (max-w-[1600px]) para que en monitores muy anchos las columnas no queden
          separadas por espacios enormes. Las columnas usan flex + justify-between
          (no grid-cols-4) para que además cada una mantenga un ancho de lectura
          razonable (max-w-xs) — lo que crece es el espacio ENTRE columnas, no
          cada columna en sí. */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:flex-wrap md:justify-between gap-10">

          {/* Identidad de la Empresa */}
          <div className="space-y-4 max-w-xs">
            <Logo variant="full" size="md" theme="dark" />
            <p className="text-xs leading-relaxed text-white/80">
              Formación profesional y técnica de estándar internacional.
            </p>
            <p className="text-xs font-semibold text-white/90">
              Grupo Empresarial Especializaciones Global LLC
            </p>
          </div>

          {/* Columna: Cursos */}
          <div className="max-w-xs">
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">
              Cursos
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/cursos"
                  className="text-xs text-white/80 hover:text-white transition-colors"
                >
                  Catálogo completo
                </Link>
              </li>
              {topCategorias.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/cursos?categorias=${cat.id}`}
                    className="text-xs text-white/80 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna: SOPORTE */}
          <div className="max-w-xs">
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">
              Soporte
            </h4>
            <ul className="space-y-2.5">
              {LINKS.soporte.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-white/80 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna: CONTACTO (Texto plano en ubicación, enlaces activos para correo y WhatsApp) */}
          <div className="max-w-xs">
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">
              Contacto
            </h4>
            <div className="space-y-3.5 text-xs text-white/80">
              {/* Ubicación en texto plano sin Google Maps */}
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#3FB1E5] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  1000 Brickell Avenue Suite #715 PMB 153 Miami, Florida 33131
                </span>
              </div>

              {/* Correo con redirección mailto: */}
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#3FB1E5] shrink-0" />
                <a
                  href="mailto:especializacionesglobal@gmail.com"
                  className="hover:text-white hover:underline transition-colors break-all"
                >
                  especializacionesglobal@gmail.com
                </a>
              </div>

              {/* WhatsApp con redirección directa */}
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#3FB1E5] shrink-0" />
                <a
                  href="https://wa.me/+51947377046?text=Hola,%20deseo%20información%20sobre%20los%20programas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors"
                >
                  +51947377046
                </a>
              </div>
            </div>
          </div>

        </div>

        <Separator className="my-10 bg-white/20" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <span>
            © {new Date().getFullYear()} Grupo Empresarial Especializaciones Global LLC. Todos los derechos reservados.
          </span>
          <span>especializacionesglobal.net</span>
        </div>
      </div>
    </footer>
  );
}