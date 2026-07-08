# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is the **frontend** of Escuela Global LMS — an online learning platform for professional specialization courses at [especializacionesglobal.net](https://especializacionesglobal.net). The backend lives in a separate repository (Nest.js + PostgreSQL + Prisma).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (Node.js v22.22.2) |
| Language | TypeScript |
| Backend (separate repo) | Nest.js |
| Auth | JWT in httpOnly cookies (`access_token` / `refresh_token`) — not a Bearer header |
| Payments | Stripe + PayPal + Mercado Pago (Brick). NIUBIZ is **not** implemented (only a leftover Prisma enum value) |
| Video | YouTube Player API (iframe embed, no S3) |
| Files | Google Drive links only — no file uploads to platform |
| Certificates | PDF generated server-side, stored in AWS S3 |

## Commands

```bash
npm run dev       # Start development server (Turbopack)
npm run build     # Production build
npm run lint      # Run ESLint
```

## Component Architecture — Atomic Design

```
src/components/
  atoms/       → Re-exports shadcn/ui primitives + custom atoms (StarRating, etc.)
  molecules/   → Combinations: CourseCard, FormField, SearchBar, CartItem, SessionItem
  organisms/   → Sections: Header, CourseGrid, VideoPlayer, CheckoutForm, DataTable
  templates/   → Page layouts: PublicLayout, DashboardLayout, AdminLayout, CourseViewLayout
  ui/          → shadcn/ui generated components (do not edit manually)
```

**Rule:** atoms import from `ui/`; molecules import from `atoms/`; organisms import from `molecules/` and `atoms/`; templates import from `organisms/`. Pages (`app/`) use templates.

## App Router Structure

Route groups map to user roles. The `src/proxy.ts` file (Next.js 16 middleware) checks the `access_token` cookie and redirects unauthenticated users to `/auth/login`; role mismatches redirect to `/sin-acceso`.

```
src/app/
  (public)/        # No auth required — auth, carrito, checkout, cursos, verificar
  (student)/       # role: estudiante — certificado, curso, dashboard, mis-certificados, mis-cursos, notificaciones, perfil
  panel/           # role-gated by proxy.ts, NOT by separate route groups
    soporte/       #   role: soporte | admin — cursos, categorias, certificados, matriculas
    marketing/     #   role: marketing | admin — publicaciones, sliders, event-types, notificaciones
    estudiantes/   #   role: admin | soporte
    cursos/        #   role: admin only
    auditoria/     #   role: admin only
    perfil/        #   role: admin | soporte | marketing
  sin-acceso/      # Access-denied page
```

There are no `(soporte)`, `(marketing)`, or `(admin)` route groups — all three roles share the single `panel/` tree, and `proxy.ts` enforces per-subpath role checks (see `ROLE_ROUTES` in that file) rather than folder-level segregation.

## Key Infrastructure Files

| File | Purpose |
|------|---------|
| `src/lib/http/api.ts` | Axios instance (`withCredentials: true` so the httpOnly cookie rides along automatically — it does not attach a token manually), redirects to `/auth/login` on 401 |
| `src/lib/providers.tsx` | React Query + Sonner toaster (wraps the entire app) |
| `src/proxy.ts` | Next.js 16 route protection — checks `access_token` cookie |
| `src/store/authStore.ts` | Zustand — user session, `hasRole()` helper |
| `src/store/cartStore.ts` | Zustand — cart items, persisted to localStorage |
| `src/types/index.ts` | All TypeScript types derived from the data model |
| `.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## Architecture

```
Frontend (Next.js) ──REST API (JWT in httpOnly cookies)──► Backend (Nest.js)
                                            │
                                  PostgreSQL / S3 / Stripe / PayPal / Mercado Pago / YouTube
```

### Role-Based Routing

Five roles each have their own entry point after login:

| Role | Landing route | Access |
|------|--------------|--------|
| Visitante (guest) | `/` | Public catalog only |
| Estudiante | `/dashboard` | Enrolled courses, progress, certs |
| Soporte | `/panel/soporte/cursos` | Course content management (note: the backend's `courses`/`categories` write endpoints are currently `@Roles('admin')` only — see `Api_endpoints.md` finding #5) |
| Marketing | `/panel/marketing/publicaciones` | Promotions & sliders |
| Administrador | `/panel` | Everything + KPIs |

Admin inherits all Soporte + Marketing permissions. There is no `/admin/dashboard` route — the admin dashboard lives at `/panel`.

### Key Route Groups (verified against `src/app/`)

**Public:** `/`, `/cursos`, `/cursos/[slug]`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/carrito`, `/checkout`, `/checkout/success`, `/verificar/[uuid]`

**Student:** `/dashboard`, `/curso/[id]`, `/mis-cursos`, `/mis-certificados`, `/certificado/[enrollment_id]`, `/perfil`, `/notificaciones`

**Panel — Soporte:** `/panel/soporte/cursos`, `/panel/soporte/cursos/nuevo`, `/panel/soporte/cursos/[id]/editar`, `/panel/soporte/cursos/[id]/contenido`, `/panel/soporte/cursos/[id]/certificaciones`, `/panel/soporte/categorias`, `/panel/soporte/matriculas`, `/panel/soporte/certificados/plantillas`

**Panel — Marketing:** `/panel/marketing`, `/panel/marketing/publicaciones`, `/panel/marketing/sliders`, `/panel/marketing/event-types`, `/panel/marketing/notificaciones`

**Panel — Admin/Soporte:** `/panel/estudiantes`, `/panel/estudiantes/[user_id]`, `/panel/estudiantes/[user_id]/cursos/[course_id]`

**Panel — Admin only:** `/panel`, `/panel/auditoria`, `/panel/cursos/[id]/matriculados`

**Panel — shared:** `/panel/perfil`

Checkout is a **prototype**, not a finished purchase flow — see `Api_endpoints.md` finding #7: there's no `orders` backend controller, and both frontend and backend fall back to a fabricated `EG-ORD-*` / `DEMO-*` order that enrolls the student directly from their cart, bypassing real `Order` persistence.

## Critical Business Rules

**Certificate flow** — A student cannot get a certificate before submitting a review, and the review requires `enrollment.progress_percent === 100` (`SubmitReviewUseCase`). The certificate is only auto-created if the course's `certification_mode` is `'auto'` and it has a `certificate_template_id` configured — otherwise the review is saved but no certificate is issued. Note: the 1–5 stars / 50–500 char comment constraints are **not validated server-side** (`SubmitReviewDto` has no `class-validator` decorators) — only enforce them in the frontend form.

**Video progress tracking** — YouTube Player API should capture `watched_seconds` periodically via `PUT /api/student/progress/sessions/:sessionId` (body: `{ watched_seconds, force_complete? }`), not `/api/progress/session/[id]` as previously documented.

**Cart persistence** — `POST /api/cart/add`, `GET /api/cart`, etc. require an authenticated session (no `@Public()` on `cart.controller.ts`). The guest/localStorage cart with 7-day TTL described here is a frontend-only concept for now — it cannot merge into a DB cart via this backend without a valid cookie, so guest checkout is effectively blocked server-side. Treat this as a known gap, not a working feature.

**Manual enrollment** — Soporte/Admin can enroll students without payment via `POST /api/enrollments` (creates `Enrollment` directly, no `Order`). Real online purchases are supposed to create both `Order` + `Enrollment`, but see the checkout prototype note above — today's payment callbacks mostly enroll directly from the cart instead.

**Soft deletes** — `User` and `Course` have a `deleted_at` column in Prisma. Enrolled students keep access to soft-deleted courses.

**Login lockout / remember-me** — Not implemented. There's no failed-attempt counter or lockout field in the schema, and `POST /api/auth/login` only accepts `{ email, password }` — no `remember_me`. Access tokens are always 15 minutes, refresh tokens always 7 days.

## Data Model Overview

Core entities: `User`, `Category`, `Course`, `Instructor`, `Module`, `Session`, `Material`

Transactional: `Enrollment`, `Order`, `OrderItem`, `CartItem`, `LessonProgress`, `EnrollmentModuleGrade`, `Review`, `Certificate`

Config/Marketing: `CertificateTemplate`, `Notification`, `Promotion`, `Slider`, `SliderCourse`, `EventType`, `AuditLog`

All PKs are UUIDs. Courses, Modules, Sessions, and Materials have a `display_order` field, but only **categories** (`PATCH /api/categories/reorder`) and **promotions** (`PATCH /api/promociones/reorder`) have a real reorder endpoint — there's no drag-and-drop reorder endpoint for modules/sessions/materials; `display_order` for those is only set through the create/update DTOs. `AuditLog` records before/after JSON diffs for course edits.

## Phase Priorities

**Phase 1 MVP (MUST HAVE):** RF-001–003, RF-005–011, RF-013–027, RF-030–033, RF-035

**Phase 2 (SHOULD HAVE):** RF-004, RF-012, RF-028–029, RF-034, RF-036

**Phase 3 (COULD HAVE):** RF-037
