import Link from "next/link";
import { buttonVariants } from "@/components/atoms";
import { SearchBar } from "@/components/molecules";
import { cn } from "@/lib/utils";
import { GraduationCap, Star, Users, Award } from "lucide-react";

const STATS = [
  { icon: Users, value: "5,000+", label: "Estudiantes" },
  { icon: GraduationCap, value: "50+", label: "Cursos" },
  { icon: Star, value: "4.8", label: "Calificación" },
  { icon: Award, value: "200+", label: "Certificados" },
];

export function HeroSection() {
  return (
    <section className="relative bg-brand-primary overflow-hidden">
      {/* Decorative circles */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/20 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/2 right-1/4 w-32 h-32 bg-brand-secondary/15 rounded-full -translate-y-1/2 pointer-events-none"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            Programas de Alta Especialización Online
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Eleva tus{" "}
            <span className="text-brand-secondary">estándares</span>{" "}
            académicos
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl mx-auto">
            Cursos especializados en estadística, software profesional, administración e ingeniería.
            Aprende de los mejores y obtén tu certificado.
          </p>

          <div className="max-w-xl mx-auto mb-10">
            <SearchBar placeholder="¿Qué quieres aprender hoy?" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cursos"
              className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-primary hover:bg-white/90 font-semibold px-8")}
            >
              Ver todos los cursos
            </Link>
            <Link
              href="/registro"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/50 text-white hover:bg-white/10 px-8")}
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3">
                <Icon className="text-brand-secondary" size={22} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave divider */}
      <div className="relative h-12 overflow-hidden pointer-events-none" aria-hidden>
        <svg
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full"
          fill="white"
        >
          <path d="M0,48 L0,20 C360,48 720,4 1080,28 C1260,42 1380,30 1440,16 L1440,48 Z" />
        </svg>
      </div>
    </section>
  );
}
