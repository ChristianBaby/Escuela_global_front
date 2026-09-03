import Link from "next/link";
import { Logo, Separator } from "@/components/atoms";
import { MapPin, Mail, Phone } from "lucide-react";

const LINKS = {
  cursos: [
    { label: "Catálogo completo", href: "/cursos" },
    { label: "Estadística y Software", href: "/cursos?category=estadistica" },
    { label: "Administración", href: "/cursos?category=administracion" },
    { label: "Ingeniería", href: "/cursos?category=ingenieria" },
  ],
  // 🚀 COLUMNA: SOPORTE
  soporte: [
    { label: "Políticas de Privacidad", href: "/institucional/politicas-de-privacidad" },
    { label: "Términos y Condiciones", href: "/institucional/terminos-y-condiciones" },
    { label: "Políticas de Reembolso", href: "/institucional/politica-de-devoluciones" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#022A5D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Identidad de la Empresa */}
          <div className="space-y-4">
            <Logo variant="full" size="md" theme="dark" />
            <p className="text-xs leading-relaxed text-white/80">
              Formación profesional y técnica de estándar internacional.
            </p>
            <p className="text-xs font-semibold text-white/90">
              Grupo Empresarial Especializaciones Global LLC
            </p>
          </div>

          {/* Columna: Cursos */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">
              Cursos
            </h4>
            <ul className="space-y-2.5">
              {LINKS.cursos.map(({ label, href }) => (
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

          {/* Columna: SOPORTE */}
          <div>
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
          <div>
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
                  href="https://wa.me/17869488349?text=Hola,%20deseo%20información%20sobre%20los%20programas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors"
                >
                  +1 (786) 948-8349
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