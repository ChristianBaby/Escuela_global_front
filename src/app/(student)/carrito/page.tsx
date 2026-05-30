import { CartContent } from "@/components/organisms/CartContent";

export const metadata = {
  title: "Carrito de Compras - Escuela Global",
  description: "Revisa tus cursos seleccionados antes de realizar tu matrícula.",
};

export default function CarritoPage() {
  return (
    <main className="container mx-auto px-4 py-8 min-h-[70vh]">
      <CartContent />
    </main>
  );
}