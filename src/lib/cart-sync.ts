import { cartService, type ApiCartItem } from "@/lib/services/cart";
import { studentService } from "@/lib/services/student";
import { useCartStore } from "@/store/cartStore";
import { isEnrollmentActive } from "@/lib/enrollment";

// La respuesta de GET /cart no siempre llega en la misma forma (a veces
// envuelta en { data: ... }, a veces como array plano) — el resto del código
// ya lidiaba con esto de forma repetida e inconsistente en cada página; esta
// función normaliza cualquiera de esas formas en un solo lugar.
export function extractCartItems(raw: unknown): ApiCartItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ApiCartItem[];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as ApiCartItem[];
  const data = obj.data;
  if (Array.isArray(data)) return data as ApiCartItem[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).items)) {
    return (data as Record<string, unknown>).items as ApiCartItem[];
  }
  return [];
}

export interface CartAuthSyncResult {
  removedAlreadyOwned: ApiCartItem[];
  totalItemsBeforeCleanup: number;
}

// Se ejecuta justo después de loguearse o registrarse — sin importar si fue
// desde /auth/login, /auth/register o el modal del checkout — para que el
// comportamiento sea el mismo en todas las entradas: funde el carrito de
// invitado con el de la cuenta y saca del carrito cualquier curso que la
// cuenta ya tenga comprado (si el carrito quedaba con eso "pegado" para
// siempre, un curso ya matriculado nunca desaparecía y el checkout se
// quedaba cargando eternamente al volver a probar).
export async function syncCartAfterAuth(guestSessionToken: string): Promise<CartAuthSyncResult> {
  await cartService.merge(guestSessionToken).catch(() => null);

  const [freshCart, myEnrollments] = await Promise.all([
    cartService.get().catch(() => null),
    studentService.getMyEnrollments().catch(() => []),
  ]);
  const freshItems = extractCartItems(freshCart);
  // Si el acceso ya venció, no cuenta como "ya lo tiene" — debe poder
  // volver a comprarlo (renovarlo), no quedar bloqueado para siempre.
  const enrolledIds = new Set(myEnrollments.filter(isEnrollmentActive).map((e) => e.course_id));
  const alreadyOwned = freshItems.filter((i) => enrolledIds.has(i.courseId));

  if (alreadyOwned.length > 0) {
    await Promise.all(alreadyOwned.map((i) => cartService.remove(i.cartItemId).catch(() => null)));
    // El carrito local (localStorage) es independiente de cualquier sesión —
    // si solo se borra la fila del servidor, el espejo local sigue creyendo
    // que el curso está ahí, y como el carrito de invitado siempre recurre a
    // ese espejo, el curso "fantasma" le seguía apareciendo a cualquiera que
    // abriera el navegador después, sin sesión.
    const removeLocalItem = useCartStore.getState().removeItem;
    alreadyOwned.forEach((i) => removeLocalItem(i.courseId));
  }

  return { removedAlreadyOwned: alreadyOwned, totalItemsBeforeCleanup: freshItems.length };
}
