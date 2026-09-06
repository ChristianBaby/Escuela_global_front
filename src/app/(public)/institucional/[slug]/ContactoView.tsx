"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, CheckCircle2 } from "lucide-react";

export function ContactoView() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "informes",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Banner Superior */}
      <section className="py-16 text-white text-center" style={{ backgroundColor: "#0B1230" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[#3FB1E5] font-bold text-xs uppercase tracking-widest bg-[#3FB1E5]/10 px-3.5 py-1.5 rounded-full border border-[#3FB1E5]/20">
            Canales de Atención
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-4 font-heading">
            Contáctate con Nosotros
          </h1>
          <p className="text-white/70 text-sm max-w-xl mx-auto mt-3">
            Grupo Empresarial Especializaciones Global LLC. Asesoría académica y soporte al estudiante.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Canales Directos */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 font-heading">
                Información de Contacto
              </h2>

              <div className="space-y-5 text-sm text-gray-600">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2B55A3] flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Correo Electrónico</p>
                    <a
                      href="mailto:especializacionesglobal@gmail.com"
                      className="font-medium text-gray-900 hover:text-[#2B55A3] transition-colors break-all"
                    >
                      especializacionesglobal@gmail.com
                    </a>
                  </div>
                </div>

                {/* WhatsApp oficial configurado */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Atención WhatsApp</p>
                    <a
                      href="https://wa.me/51947377046?text=Hola,%20deseo%20información%20sobre%20los%20cursos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-emerald-600 transition-colors"
                    >
                      +51 947 377 046
                    </a>
                  </div>
                </div>

                {/* Dirección en Miami */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#3FB1E5] flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Oficina Principal</p>
                    <p className="font-medium text-gray-900 leading-snug">
                      1000 Brickell Avenue Suite #715 PMB 153 Miami, Florida 33131
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Horario de Atención</p>
                    <p className="font-medium text-gray-900">
                      Lunes a Sábado: 08:00 - 20:00 (UTC-5)
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón directo a WhatsApp */}
              <div className="pt-2">
                <a
                  href="https://wa.me/51947377046?text=Hola,%20deseo%20información%20sobre%20los%20cursos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
                >
                  <MessageCircle size={17} /> Chatear por WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 font-heading mb-1">
                Envíanos un Mensaje
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Completa el formulario y te responderemos en 24 a 48 horas hábiles.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-base font-bold text-emerald-900">¡Mensaje Enviado con Éxito!</h3>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Nos pondremos en contacto contigo a la brevedad.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs font-semibold text-emerald-800 underline hover:text-emerald-900"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Juan Pérez"
                        className="w-full text-xs rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B55A3]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ejemplo@correo.com"
                        className="w-full text-xs rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B55A3]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+51 947 377 046"
                        className="w-full text-xs rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B55A3]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Motivo de Consulta</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full text-xs rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2B55A3]"
                      >
                        <option value="informes">Información de Cursos</option>
                        <option value="certificados">Validación de Certificados</option>
                        <option value="soporte">Soporte de Cuenta y Accesos</option>
                        <option value="pagos">Dudas de Pagos / Comprobantes</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Mensaje *</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Escribe tu consulta aquí..."
                      className="w-full text-xs rounded-lg border border-gray-300 p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B55A3]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2B55A3] hover:bg-[#2B55A3]/90 text-white font-medium px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    <Send size={14} /> Enviar Mensaje
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}