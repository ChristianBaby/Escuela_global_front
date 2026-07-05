const SUPPORT_WHATSAPP_NUMBER = "51953862509";
const SUPPORT_WHATSAPP_MESSAGE = "Hola, quiero información sobre los cursos de Escuela Global.";

export function WhatsAppButton() {
  const href = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar soporte por WhatsApp"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M16.004 2.667c-7.364 0-13.333 5.968-13.333 13.333 0 2.353.615 4.66 1.784 6.687L2.667 29.333l6.826-1.79a13.27 13.27 0 0 0 6.51 1.657h.006c7.364 0 13.333-5.968 13.333-13.333S23.368 2.667 16.004 2.667Zm0 24.4h-.005a11.05 11.05 0 0 1-5.633-1.542l-.404-.24-4.05 1.063 1.082-3.948-.264-.406a11.04 11.04 0 0 1-1.696-5.895c0-6.11 4.972-11.083 11.076-11.083 2.959 0 5.74 1.154 7.833 3.25a11.001 11.001 0 0 1 3.24 7.838c-.002 6.11-4.974 11.083-11.08 11.083Zm6.075-8.294c-.333-.167-1.966-.97-2.271-1.08-.305-.111-.527-.167-.749.167-.222.333-.86 1.08-1.054 1.302-.194.222-.389.25-.722.083-.333-.167-1.406-.519-2.68-1.653-.99-.883-1.659-1.974-1.853-2.307-.194-.333-.02-.513.146-.68.15-.149.333-.389.5-.583.167-.194.222-.333.333-.555.111-.222.056-.417-.028-.583-.083-.167-.749-1.805-1.026-2.472-.27-.65-.545-.562-.749-.573-.194-.01-.416-.012-.638-.012-.222 0-.583.083-.888.417-.305.333-1.166 1.14-1.166 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.352 3.593 5.7 5.038.796.344 1.417.55 1.901.703.799.254 1.526.218 2.101.132.641-.096 1.966-.804 2.243-1.58.278-.777.278-1.443.194-1.58-.083-.139-.305-.222-.638-.389Z" />
      </svg>
    </a>
  );
}
