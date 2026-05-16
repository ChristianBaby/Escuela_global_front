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
  soporte: [
    { label: "Preguntas frecuentes", href: "/#faq" },
    { label: "Términos de uso", href: "/terminos" },
    { label: "Política de privacidad", href: "/privacidad" },
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
    <footer className="bg-brand-dark text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Logo variant="full" size="md" theme="dark" />
            <p className="text-sm leading-relaxed text-white/60">
              Plataforma especializada en formación profesional de alta calidad. Crece, globaliza y
              profesionalízate.
            </p>
            <div className="flex gap-3 pt-1">
              {SOCIAL.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-brand-secondary transition-colors"
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
                    className="text-sm text-white/60 hover:text-brand-secondary transition-colors"
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
                    className="text-sm text-white/60 hover:text-brand-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Soporte</h4>
            <ul className="space-y-2.5">
              {LINKS.soporte.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-brand-secondary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Escuela Global. Todos los derechos reservados.</span>
          <span>especializacionesglobal.net</span>
        </div>
      </div>
    </footer>
  );
}
