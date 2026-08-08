import { Check } from "lucide-react";

const CHECKLIST = [
  "Certificado con código QR",
  "Nota mínima aprobatoria de 14",
  "Contenido del curso y/o programa",
  "Firmas de representantes académicos",
];

export function CertificateShowcase() {
  return (
    <section className="py-16" style={{ backgroundColor: "#0B1230" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-secondary font-bold text-sm uppercase tracking-widest">
            Certificaciones
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-2">Modelos de Certificados</h2>
          <div className="w-16 h-1 bg-brand-secondary rounded-full mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Tarjeta con flip 3D — cara y contraportada */}
          <div className="group w-full [perspective:1500px]">
            <div className="relative w-full aspect-[4/3] transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              <img
                src="/cara.png"
                alt="Modelo de certificado"
                className="absolute inset-0 w-full h-full object-contain rounded-xl shadow-2xl [backface-visibility:hidden]"
              />
              <img
                src="/contraportada.png"
                alt="Contraportada del certificado"
                className="absolute inset-0 w-full h-full object-contain rounded-xl shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
              />
            </div>
          </div>

          {/* Texto y checklist */}
          <div>
            <p className="text-xl sm:text-2xl text-white leading-relaxed mb-8">
              Tu certificado contará con los <span className="text-brand-secondary font-semibold">4 puntos clave</span> para ser válido.
            </p>
            <ul className="space-y-5">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-secondary shrink-0">
                    <Check className="text-white" size={16} strokeWidth={3} />
                  </span>
                  <span className="text-white text-base sm:text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
