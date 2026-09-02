import Link from "next/link";
import { Logo, Separator } from "@/components/atoms";
import { Globe, Video, Camera, Briefcase } from "lucide-react";

const LINKS = {
  
  cursos: [
    { label: "Catálogo completo", href: "/cursos" },
    { label: "Estadística y Software", href: "/cursos?category=estadistica" },
    { label: "Administración", href: "/cursos?category=administracion" },
    { label: "Ingeniería", href: "/cursos?category=ingenieria" },
  ],
  plataforma: [
    { label: "Iniciar sesión", href: "/auth/login" },
    { label: "Registrarse", href: "/auth/register" },
    { label: "Recuperar contraseña", href: "/auth/forgot-password" },
  ],
  // 🚀 RUTAS INSTITUCIONALES Y LEGALES CENTRALIZADAS
  // Dentro del objeto LINKS en Footer.tsx:
  institucional: [
    { label: "Sobre Nosotros", href: "/institucional/nosotros" },
    { label: "Contáctanos", href: "/institucional/contacto" }, // 🚀 Nuevo enlace
    { label: "Política de devoluciones", href: "/institucional/politica-de-devoluciones" },
    { label: "Términos y condiciones", href: "/institucional/terminos-y-condiciones" },
    { label: "Políticas de privacidad", href: "/institucional/politicas-de-privacidad" },
  ],
};

const SOCIAL = [
  { label: "Facebook", icon: Globe, href: "#" },
  { label: "Instagram", icon: Camera, href: "#" },
  { label: "YouTube", icon: Video, href: "#" },
  { label: "LinkedIn", icon: Briefcase, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-[#022A5D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Logo variant="full" size="md" theme="dark" />
            <p className="text-sm leading-relaxed text-white">
              Plataforma especializada en formación profesional de alta calidad. Crece, globaliza y
              profesionalízate.
              <br></br>
              <br></br>
              Cal. Juan Espinoza Medrano Nro Q-13 Dpto 303, Urb. Rosaspata (Edificio Ais Automation, Int 302 N 258) Wanchaq - Cusco - Perú
            </p>
            <div className="flex gap-3 pt-1">
              {SOCIAL.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand-secondary transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Cursos</h4>
            <ul className="space-y-2.5">
              {LINKS.cursos.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white hover:text-brand-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-2.5">
              {LINKS.plataforma.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white hover:text-brand-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna Institucional & Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Institucional & Legal</h4>
            <ul className="space-y-2.5">
              {LINKS.institucional.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white hover:text-brand-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/20" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white">
          <span>© {new Date().getFullYear()} Escuela Global. Todos los derechos reservados.</span>
          <span>especializacionesglobal.net</span>
        </div>
      </div>
    </footer>
  );
}