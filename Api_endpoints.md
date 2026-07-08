# API Endpoints – Escuela Global (lms-backend)

> Generado a partir del código fuente real de `lms-backend/src` (controllers, DTOs, guards).
> Última actualización: 2026-07-07. Reemplaza la versión anterior basada en el Api_endpoints.xlsx original (especificación, no implementación).

Base URL: `{API_URL}/api` (prefijo global `api` definido en `main.ts`).

---

## Modelo de autenticación (real, distinto al documento anterior)

- **No se usa `Authorization: Bearer <token>`.** El login (`POST /api/auth/login`) fija dos cookies **httpOnly**: `access_token` (15 min) y `refresh_token` (7 días). Todas las peticiones autenticadas dependen de esas cookies (el navegador las envía solo si el frontend usa `credentials: 'include'`).
- Hay dos guards globales (`APP_GUARD`) aplicados a **todas** las rutas: `AuthGuard` (lee/valida las cookies JWT, intenta refresh automático) y `RolesGuard` (valida `@Roles(...)`).
- Una ruta requiere sesión válida **salvo que** el controller o el método tengan `@Public()`.
- Si un método no tiene `@Roles(...)`, cualquier usuario autenticado (sin importar el rol) puede acceder — no hay restricción adicional de rol.
- `role: 'admin'` **siempre pasa** cualquier `@Roles(...)`, sin importar la lista (bypass hardcodeado en `RolesGuard`).

| Auth en las tablas | Significado |
|---|---|
| Público | `@Public()` — no requiere cookie de sesión |
| Autenticado | Sin `@Public()` ni `@Roles()` — cualquier rol logueado |
| Roles: `x, y` | Requiere `role` en esa lista (o `admin`, que siempre pasa) |

---

## Índice

1. [Autenticación](#autenticación)
2. [Usuarios y Perfil](#usuarios-y-perfil)
3. [Administración y Dashboard](#administración-y-dashboard)
4. [Catálogo y Gestión de Cursos](#catálogo-y-gestión-de-cursos)
5. [Categorías](#categorías)
6. [Módulos, Sesiones y Materiales](#módulos-sesiones-y-materiales)
7. [Certificaciones por curso (notas/Excel)](#certificaciones-por-curso-notasexcel)
8. [Matriculaciones manuales](#matriculaciones-manuales)
9. [Reseñas](#reseñas)
10. [Certificados del estudiante, plantillas y verificación pública](#certificados-del-estudiante-plantillas-y-verificación-pública)
11. [Carrito](#carrito)
12. [Pagos](#pagos)
13. [Marketing](#marketing)
14. [Notificaciones](#notificaciones)
15. [Utilitarios](#utilitarios)
16. [⚠️ Hallazgos y brechas respecto a la especificación original](#️-hallazgos-y-brechas-respecto-a-la-especificación-original)

---

## AUTENTICACIÓN

Controller: `auth.controller.ts` · Base: `/api/auth` · Todo el controller es `@Public()`.

| Método | Endpoint | Auth | Body | Notas |
|---|---|---|---|---|
| POST | `/api/auth/register` | Público | `{ first_name, last_name, email, phone, password }` | Sin `class-validator` todavía (comentario en el DTO: "Luego implementar"). No pide `password_confirmation`, `country` ni `full_name`. |
| POST | `/api/auth/login` | Público | `{ email, password }` | **No** existe `remember_me`. Fija cookies `access_token` (15 min) y `refresh_token` (7 días). Responde `{ mensaje, user }` (no expone el token en el JSON). |
| GET | `/api/auth/verify-email` | Público | query `?token=` | Activa la cuenta. |
| POST | `/api/auth/forgot-password` | Público | `{ email }` | No implementa captcha. |
| POST | `/api/auth/reset-password` | Público | `{ password, token }` | |
| POST | `/api/auth/logout` | Público | — | Limpia ambas cookies. |

**No existen:** `POST /auth/refresh-token` como endpoint propio (el refresh ocurre de forma transparente dentro de `AuthGuard` cuando el `access_token` expiró), ni `GET /auth/check-email`, ni bloqueo por 5 intentos fallidos, ni distinción de sesión 24h/30 días — todo eso estaba en la especificación pero no en el código.

---

## USUARIOS Y PERFIL

Controller: `users.controller.ts` · Base: `/api/users`

| Método | Endpoint | Auth | Body / Query | Notas |
|---|---|---|---|---|
| GET | `/api/users/profile/:id` | Autenticado | — | |
| PATCH | `/api/users/profile/:id` | **Público** ⚠️ | FormData `{ photo?: File, ...UpdateProfileDto }` | Ver hallazgo: no requiere sesión pese a modificar datos de un usuario por `id`. `UpdateProfileDto`: `first_name?, last_name?, phone?, country?, profession?`. Sube foto a disco local (`./uploads/profiles`), no a S3. |
| GET | `/api/users/buscar` | Roles: `admin` | query `?q=&role=` | Autocompletado de usuarios. |
| GET | `/api/users/:id` | Roles: `admin` | — | |
| POST | `/api/users` | Roles: `admin` | `{ first_name, last_name, email, phone, country?, role, password }` | Crea usuario con cualquier rol. |
| PATCH | `/api/users/:id` | Roles: `admin` | Campos de `CreateUsuarioDto`, todos opcionales | |
| PATCH | `/api/users/:id/suspender` | Roles: `admin` | — | (la especificación decía `/suspend`, en inglés) |
| PATCH | `/api/users/:id/activar` | Roles: `admin` | — | No estaba en la especificación original. |
| DELETE | `/api/users/:id` | Roles: `admin` | — | Soft delete. |

No existe `PUT /api/profile/password` (cambio de contraseña) ni `/api/profile/notification-preferences`.

---

## ADMINISTRACIÓN Y DASHBOARD

Controller: `admin.controller.ts` · Base: `/api/admin` · Class-level `@Roles('admin')` (algunos métodos se abren también a `soporte`).

| Método | Endpoint | Auth | Query | Descripción |
|---|---|---|---|---|
| GET | `/api/admin/usuarios` | Roles: `admin, soporte` | `?page&limit&search&role&status` | Listado de usuarios. |
| GET | `/api/admin/stats` | Roles: `admin` | `?desde&hasta&categoria_id` | KPIs del dashboard. |
| GET | `/api/admin/export` | Roles: `admin` | `?desde&hasta&categoria_id` | Descarga Excel del dashboard. |
| GET | `/api/admin/auditoria` | Roles: `admin` | `?page&limit` | Logs de auditoría. |
| GET | `/api/admin/charts/ingresos` | Roles: `admin` | `?desde&hasta&categoria_id` | Gráfico de ingresos. |
| GET | `/api/admin/charts/top-cursos` | Roles: `admin` | igual | |
| GET | `/api/admin/charts/categorias` | Roles: `admin` | — | Distribución por categoría. |
| GET | `/api/admin/charts/estudiantes` | Roles: `admin` | `?desde&hasta&categoria_id` | Estudiantes activos. |
| GET | `/api/admin/top-finalizacion` | Roles: `admin` | igual | |
| GET | `/api/admin/top-estudiantes` | Roles: `admin` | igual | |
| GET | `/api/admin/cursos/:cursoId/matriculados` | Roles: `admin` | `?page&limit&search&status&enrollment_type` | Reporte de matriculados por curso. |
| GET | `/api/admin/cursos/:cursoId/matriculados/export` | Roles: `admin` | — | Descarga Excel. |
| GET | `/api/admin/estudiantes/:userId` | Roles: `admin, soporte` | — | Detalle de estudiante. |
| GET | `/api/admin/estudiantes/:userId/cursos/:courseId/actividad` | Roles: `admin, soporte` | — | Actividad granular. |

Todas las exportaciones son **Excel (.xlsx)** vía `exceljs`, no CSV como decía la especificación original.

---

## CATÁLOGO Y GESTIÓN DE CURSOS

Controller: `courses.controller.ts` · Base: `/api/courses`

| Método | Endpoint | Auth | Body / Query | Notas |
|---|---|---|---|---|
| GET | `/api/courses` | Público | `CursoParams`: `page, limit, search, status, categoria_id, categoria_ids, sort, min_rating, softwares, min_price, max_price, duration` | Nombres de query reales en español/snake_case, distintos a la especificación (`category`, `price_min`, etc.). |
| GET | `/api/courses/catalog` | Público | igual `CursoParams` | Catálogo público (separado de `getAll`). |
| GET | `/api/courses/featured` | Público | `?limit=` (default 8) | |
| GET | `/api/courses/softwares` | Público | — | Lista de softwares usados (para filtros). |
| GET | `/api/courses/:id` | Público | — | Por UUID. |
| GET | `/api/courses/slug/:slug` | Público | — | La especificación original usaba `/api/courses/:slug` directo; en el código real la ruta por slug vive bajo `/slug/:slug`. |
| POST | `/api/courses` | **Roles: `admin`** ⚠️ | `CreateCourseDto` (ver abajo) | No incluye `soporte`, pese a que el frontend tiene un panel `soporte/cursos`. |
| PATCH | `/api/courses/:id` | Roles: `admin` | Campos de `CreateCourseDto` opcionales + `certification_mode?, certificate_template_id?, constancia_template_id?` | La especificación decía `PUT`; el método real es `PATCH`. |
| DELETE | `/api/courses/:id` | Roles: `admin` | — | |
| POST | `/api/courses/:id/thumbnail` | Roles: `admin` | FormData `{ thumbnail: File }` (jpg/png/webp, máx 5MB) | |
| POST | `/api/courses/:id/instructors` | Roles: `admin` | `CreateInstructorDto`: `{ full_name, title, description?, photo_url?, display_order? }` | |
| DELETE | `/api/courses/:id/instructors/:instructorId` | Roles: `admin` | — | |
| GET | `/api/courses/:id/matriculados` | Roles: `admin` | `?page&limit&search` | |

`CreateCourseDto`: `category_id, title, slug?, tagline, description, thumbnail_url?, level, software_tools[], price, discount_price?, currency, access_duration, prerequisites[], outcomes[], status, instructors?[], academic_hours?`.

---

## CATEGORÍAS

Controller: `categories.controller.ts` · Base: `/api/categories`

| Método | Endpoint | Auth | Body | Notas |
|---|---|---|---|---|
| GET | `/api/categories` | Público | — | |
| GET | `/api/categories/:id` | Público | — | No estaba en la especificación original. |
| POST | `/api/categories` | **Roles: `admin`** ⚠️ | `{ name, slug, icon, color, description?, display_order? }` | No incluye `soporte`. |
| PATCH | `/api/categories/reorder` | Roles: `admin` | `{ ids: string[] }` | La especificación decía `PUT .../reorder` con `{ order: [{id, display_order}] }`; el real usa `PATCH` + `{ ids: [] }` (orden = índice del array). |
| PATCH | `/api/categories/:id` | Roles: `admin` | `UpdateCategoriaDto` | |
| DELETE | `/api/categories/:id` | Roles: `admin` | — | |

---

## MÓDULOS, SESIONES Y MATERIALES

Controllers: `modules.controller.ts`, `sessions.controller.ts`, `materials.controller.ts` · Sin prefijo propio (rutas montadas directo bajo `/api`).

| Método | Endpoint | Auth | Body |
|---|---|---|---|
| GET | `/api/courses/:courseId/modules` | Público | — |
| GET | `/api/modules/:id` | Público | — |
| POST | `/api/courses/:courseId/modules` | **Autenticado (cualquier rol)** ⚠️ | `{ title, description? }` |
| PATCH | `/api/modules/:id` | **Autenticado (cualquier rol)** ⚠️ | `UpdateModuleDto` |
| DELETE | `/api/modules/:id` | **Autenticado (cualquier rol)** ⚠️ | — |
| GET | `/api/modules/:moduleId/sessions` | Público | — |
| GET | `/api/sessions/:id` | Público | — |
| POST | `/api/modules/:moduleId/sessions` | **Autenticado (cualquier rol)** ⚠️ | `{ title, description?, youtube_url, youtube_video_id?, duration_minutes?, display_order? }` |
| PATCH | `/api/sessions/:id` | **Autenticado (cualquier rol)** ⚠️ | `UpdateSessionDto` |
| DELETE | `/api/sessions/:id` | **Autenticado (cualquier rol)** ⚠️ | — |
| GET | `/api/sessions/:sessionId/materials` | Autenticado | — |
| POST | `/api/sessions/:sessionId/materials` | **Autenticado (cualquier rol)** ⚠️ | `{ name, drive_url, type }` |
| DELETE | `/api/materials/:id` | **Autenticado (cualquier rol)** ⚠️ | — |

No existen los endpoints de `reorder` (drag-and-drop) para módulos/sesiones que describía la especificación original — el campo `display_order` se envía directo en el DTO de creación/edición.

---

## CERTIFICACIONES POR CURSO (NOTAS/EXCEL)

Controller: `certifications.controller.ts` · Base: `/api/courses/:courseId/certifications` · Class-level `@Roles('admin', 'soporte')`. **Funcionalidad nueva, no existía en la especificación original.**

| Método | Endpoint | Body / Notas |
|---|---|---|
| GET | `/api/courses/:courseId/certifications` | Lista notas/certificaciones del curso. |
| GET | `/api/courses/:courseId/certifications/export` | Descarga Excel (`.xlsx`). |
| POST | `/api/courses/:courseId/certifications/import` | FormData `{ file }` — importa notas desde Excel. |
| POST | `/api/courses/:courseId/certifications/emit` | `{ enrollment_id, type: 'Certificado'\|'Constancia', template_id }` |
| DELETE | `/api/courses/:courseId/certifications/emit/:enrollmentId` | Revoca el certificado emitido. |

---

## MATRICULACIONES MANUALES

Controller: `enrollments.controller.ts` · Base: `/api/enrollments` · Class-level `@Roles('admin', 'soporte')`.

| Método | Endpoint | Body / Query |
|---|---|---|
| GET | `/api/enrollments` | `MatriculasParams`: `?page&limit&search&curso_id` |
| POST | `/api/enrollments` | `{ user_id, course_ids: [], offline_payment_method: 'transferencia'\|'efectivo'\|'cortesia'\|'otro', offline_amount?, internal_notes? }` |
| DELETE | `/api/enrollments/:id` | — |

Nota: no existe `GET /api/soporte/users/search` — el buscador de estudiantes para matricular usa `GET /api/users/buscar` (ver sección Usuarios).

---

## RESEÑAS

Controller: `reviews.controller.ts` · Base: `/api/reviews` · Class-level `@Roles('estudiante')`.

| Método | Endpoint | Body | Notas |
|---|---|---|---|
| POST | `/api/reviews` | `{ course_id, enrollment_id, rating, comment }` | Requiere que `enrollment.progress_percent === 100` (no hay validación de longitud de comentario 50–500 en el DTO). Si el curso tiene `certification_mode: 'auto'` y una plantilla configurada, genera el certificado automáticamente. |

No existe `GET /api/courses/:slug/reviews` (listado público de reseñas) como endpoint separado — no se encontró un controller para reseñas públicas.

---

## CERTIFICADOS DEL ESTUDIANTE, PLANTILLAS Y VERIFICACIÓN PÚBLICA

Controllers: `certificates.controller.ts` (`@Roles('estudiante')`), `certificate-templates.controller.ts` (`@Roles('admin')`), `public-certificates.controller.ts` (`@Public()`) — **los dos primeros y `public-certificates` comparten el mismo path base `/api/certificates`.**

| Método | Endpoint | Auth | Notas |
|---|---|---|---|
| GET | `/api/certificates` | Roles: `estudiante` | Certificados del usuario logueado. |
| GET | `/api/certificates/:id` | Roles: `estudiante` | |
| GET | `/api/certificates/:id/download` | Roles: `estudiante` | Genera y descarga el PDF (`Content-Type: application/pdf`). |
| GET | `/api/certificates/verify/:code` | Público (⚠️ ver hallazgo de shadowing de rutas) | Verificación pública por código. |
| GET | `/api/certificate-templates` | Roles: `admin` | |
| GET | `/api/certificate-templates/:id` | Roles: `admin` | |
| POST | `/api/certificate-templates` | Roles: `admin` | FormData: `name, background_image?, back_image?, student_name_position, qr_position, qr_size?, font_family, font_sizes` (todo como strings/JSON-string, sin los campos `course_name_position`/`dates_position`/`verification_code_position` de la especificación original). |
| PATCH | `/api/certificate-templates/:id` | Roles: `admin` | Mismos campos que POST. |
| POST | `/api/certificate-templates/:id/activate` | Roles: `admin` | |
| DELETE | `/api/certificate-templates/:id` | Roles: `admin` | |

También existen, fuera de `/certificates`, dentro de `student.controller.ts` (`/api/student/...`, ver más abajo): `GET /api/student/certificates` y `GET /api/student/certificates/:enrollmentId` — es decir, **hay dos rutas distintas para "mis certificados"** (`/api/certificates` y `/api/student/certificates`) que apuntan a casos de uso equivalentes.

### Área del estudiante (`student.controller.ts`, base `/api/student`, `@Roles('estudiante')`)

| Método | Endpoint | Notas |
|---|---|---|
| GET | `/api/student/enrollments` | Mis cursos matriculados. |
| GET | `/api/student/courses/:courseId/content` | Auto-matricula al estudiante en Postgres si no existe `Enrollment` previo (comportamiento no documentado originalmente: acceso automático a cualquier curso sin pasar por checkout). |
| GET | `/api/student/progress/courses/:courseId` | Ídem, con el mismo escudo de auto-matrícula. |
| GET | `/api/student/certificates` | |
| GET | `/api/student/certificates/:enrollmentId` | |
| PUT | `/api/student/progress/sessions/:sessionId` | `{ watched_seconds: number, force_complete?: boolean }` |

---

## CARRITO

Controller: `cart.controller.ts` · Base: `/api/cart` · **Sin `@Public()` en ningún método** ⚠️ (ver hallazgo).

| Método | Endpoint | Auth | Query / Body |
|---|---|---|---|
| GET | `/api/cart` | Autenticado | `?userId=&token=` |
| POST | `/api/cart/add` | Autenticado | `{ course_id, user_id?, session_token? }` |
| DELETE | `/api/cart/remove/:id` | Autenticado | — |
| DELETE | `/api/cart/clear` | Autenticado | `?userId=&token=` |
| POST | `/api/cart/merge` | Autenticado | `{ userId, sessionToken }` |

La especificación original documentaba el carrito como público (invitado con `session_token`, sin login). En el código actual, al no llevar `@Public()`, el guard global exige cookie de sesión válida en **todas** las rutas — el soporte de carrito de invitado (`localStorage` + `session_token`) que describe `CLAUDE.md` del frontend no puede funcionar contra este backend tal como está.

---

## PAGOS

Controllers: `payments.controller.ts` (base `/api/payments`) y `paypal.controller.ts` (base `/api/payments/paypal`) · Sin `@Public()` → requieren sesión.

| Método | Endpoint | Body |
|---|---|---|
| POST | `/api/payments/session` | `CreatePaymentIntentDto`: `{ orderId, paymentMethod: 'stripe'\|'paypal'\|'mercado_pago' }` |
| POST | `/api/payments/mercadopago/brick` | `ProcessBrickPaymentDto`: `{ orderId, token, payment_method_id, installments, issuer_id?, payer: { email, identification? } }` |
| POST | `/api/payments/paypal/capture/:paypalOrderId` | — |
| POST | `/api/payments/paypal/create-order` | `{ orderId }` (vía `orderId` en el body) |
| POST | `/api/payments/paypal/capture/:paypalOrderId` (controller alterno) | — | Nota: existen **dos** endpoints con el mismo path `payments/paypal/capture/:paypalOrderId` en dos controllers distintos (`PaymentsController` y `PaypalController`); Nest registra ambos módulos, por lo que solo el primero cargado por el módulo responderá. |

Pasarelas reales implementadas: **Stripe, PayPal y Mercado Pago (Brick)**. `niubiz` sigue existiendo como valor del enum `PaymentMethod` en `schema.prisma`, pero **no hay ningún adapter de NIUBIZ** en el código — la pasarela peruana que menciona el `CLAUDE.md` del frontend no está implementada.

---

## MARKETING

### Promociones — Controller: `promotions.controller.ts` · Base real: **`/api/promociones`** (no `/api/marketing/promotions`)

| Método | Endpoint | Auth | Body |
|---|---|---|---|
| GET | `/api/promociones` | Público | `?vigente=true\|false` |
| POST | `/api/promociones` | Autenticado (sin `@Roles`) ⚠️ | FormData: `CreatePromotionDto` + `image?: File` |
| PATCH | `/api/promociones/reorder` | Autenticado | `{ ids: string[] }` |
| PATCH | `/api/promociones/:id` | Autenticado | Igual que POST |
| DELETE | `/api/promociones/:id` | Autenticado | — |

### Sliders — Controller: `sliders.controller.ts` · Base real: **`/api/sliders`** (no `/api/marketing/sliders`)

| Método | Endpoint | Auth | Body |
|---|---|---|---|
| GET | `/api/sliders` | Público | — |
| POST | `/api/sliders` | Autenticado (sin `@Roles`) ⚠️ | `CreateSliderDto`: `{ title, subtitle?, type: 'courses'\|'banner', event_type_id?, image_url?, destination_url?, contact_url?, position_on_page, display_order?, status, course_ids?[] }` |
| PATCH | `/api/sliders/:id` | Autenticado | Campos de `CreateSliderDto` |
| DELETE | `/api/sliders/:id` | Autenticado | — |
| POST | `/api/sliders/:id/image` | Roles: `admin` | FormData `{ image: File }` |

### Tipos de evento — Controller: `event-types.controller.ts` · Base: `/api/event-types`

| Método | Endpoint | Auth | Body |
|---|---|---|---|
| GET | `/api/event-types` | Público | — |
| POST | `/api/event-types` | Roles: `admin, marketing` | `{ name, display_order? }` |
| PATCH | `/api/event-types/:id` | Roles: `admin, marketing` | |
| DELETE | `/api/event-types/:id` | Roles: `admin, marketing` | |

### Notificaciones de marketing (push masivo) — Controller: `marketing-notifications.controller.ts` · Base: `/api/marketing/notifications`

| Método | Endpoint | Auth | Body / Query |
|---|---|---|---|
| GET | `/api/marketing/notifications/recipients` | Roles: `admin, marketing` | `?search=&course_id=` |
| POST | `/api/marketing/notifications/send` | Roles: `admin, marketing` | `{ title, body, redirect_url?, type?, audience: 'all'\|'course'\|'users', course_id?, user_ids?[] }` |

No existe `GET /api/homepage/promotions` ni `GET /api/homepage/sliders`: el frontend debe consumir directamente `GET /api/promociones?vigente=true` y `GET /api/sliders`.

---

## NOTIFICACIONES

Controller: `notifications.controller.ts` · Base: `/api/notifications` · Sin `@Roles` → cualquier usuario autenticado.

| Método | Endpoint | Notas |
|---|---|---|
| GET | `/api/notifications` | Notificaciones del usuario logueado (no pagina, no filtra por leídas via query). |
| PATCH | `/api/notifications/:id/read` | |
| PATCH | `/api/notifications/read-all` | |

No existe `GET /api/notifications/unread-count` como endpoint separado, ni `/api/profile/notification-preferences`.

---

## UTILITARIOS

Controller: `app.controller.ts` (raíz, sin prefijo de módulo)

| Método | Endpoint | Auth | Notas |
|---|---|---|---|
| GET | `/api` | Público (no tiene guard aplicado explícitamente, pero al no ser `@Public()` y no requerir rol, cae bajo "autenticado" salvo excepción de Nest para la ruta raíz) | Health-check simple (`getHello`). |
| GET | `/api/health-db` | — | Prueba de conexión a la base de datos. |

No existen `POST /api/upload/image` (upload genérico) ni `GET /api/admin/audit-logs` con ese path exacto (la auditoría real vive en `GET /api/admin/auditoria`, ver sección Administración).

---

## ⚠️ Hallazgos y brechas respecto a la especificación original

Estos puntos surgieron al leer el código fuente real (`lms-backend/src`) y vale la pena revisarlos con el equipo de backend antes de asumir que el sistema funciona como describía el Excel original:

1. **Autenticación por cookies, no Bearer token.** Cualquier cliente HTTP (Postman, un frontend distinto) debe enviar cookies (`credentials: 'include'`), no un header `Authorization`.
2. **`PATCH /api/users/profile/:id` es público.** Permite editar el perfil (incluida la foto) de cualquier `id` sin sesión. Muy probablemente un bug de un `@Public()` mal puesto (quizá copiado de otra ruta durante desarrollo).
3. **Carrito sin `@Public()`.** Como el guard global exige sesión salvo excepción explícita, el flujo de "carrito de invitado" (`localStorage` + `session_token`) que documenta el `CLAUDE.md` del frontend no puede completarse contra este backend: `POST /api/cart/add` sin cookie responde 401.
4. **Verificación pública de certificados posiblemente inalcanzable.** `CertificatesController` (con `GET ':id'`, rol `estudiante`) se registra antes que `PublicCertificatesController` (`GET 'verify/:code'`, público) dentro de `users.module.ts`. Nest/Express resuelve rutas en orden de registro, por lo que una petición a `/api/certificates/verify/ABC123` coincide primero con `GET :id` y exige rol `estudiante`, dejando la verificación pública (pensada para empleadores/universidades sin login) inaccesible tal como está el orden actual.
5. **`soporte` no puede gestionar cursos ni categorías en el backend**, aunque el frontend tiene páginas para ello (`panel/soporte/cursos`, `panel/soporte/categorias`). Los endpoints de escritura en `courses.controller.ts` y `categories.controller.ts` usan `@Roles('admin')` únicamente.
6. **Módulos, sesiones y materiales no tienen restricción de rol** (`modules.controller.ts`, `sessions.controller.ts`, `materials.controller.ts`): cualquier usuario autenticado, incluido un `estudiante`, puede crear/editar/eliminar contenido de un curso.
7. **El flujo de checkout/compra es un prototipo, no una integración real de punta a punta.** No existe ningún `orders.controller.ts` ni llamada real a `prisma.order.create` en el código; `CreatePaymentSessionUseCase` fabrica una orden "DEMO-" cuando no encuentra el `orderId` en base de datos, y `ProcessPaymentCallbackUseCase` tiene una rama "demo" que matricula al usuario directamente desde su carrito (sin `Order` ni `OrderItem`) cuando el `orderId` no existe o empieza con `EG-ORD-`. El propio frontend (`checkout/page.tsx`) genera un `demoOrderId` local (`"EG-ORD-" + random`). En producción, con órdenes reales, existe una segunda rama ("flujo real") que si actualiza `Order`/crea `Enrollment`, pero nada en el código actual llega a crear esa orden real primero.
8. **NIUBIZ no está implementado.** Sigue en el enum de Prisma pero no hay adapter; las pasarelas reales son Stripe, PayPal y Mercado Pago.
9. **Rutas de Marketing con nombres distintos:** promociones vive en `/api/promociones` (no `/api/marketing/promotions`) y sliders en `/api/sliders` (no `/api/marketing/sliders`). Solo "tipos de evento" y "notificaciones masivas" están realmente bajo `/api/marketing/...`.
10. **No existen** `GET /api/auth/check-email`, `PUT /api/profile/password`, `/api/profile/notification-preferences`, `/api/notifications/unread-count`, `POST /api/upload/image`, ni endpoints de reordenamiento drag-and-drop para módulos/sesiones/materiales — todos estaban en la especificación original pero no se implementaron.
11. **Doble ruta para "mis certificados"**: `/api/certificates` (rol `estudiante`) y `/api/student/certificates` resuelven casos de uso equivalentes; conviene que el frontend estandarice en una sola.
