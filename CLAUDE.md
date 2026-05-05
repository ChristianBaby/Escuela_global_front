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
| Auth | JWT (REST API) |
| Payments | Stripe (international) + NIUBIZ (Peru) |
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

Route groups map to user roles. The `src/proxy.ts` file (Next.js 16 middleware) redirects unauthenticated users to `/login`.

```
src/app/
  (public)/        # No auth required
  (student)/       # role: estudiante
  (soporte)/       # role: soporte | admin
  (marketing)/     # role: marketing | admin
  (admin)/         # role: admin only
```

## Key Infrastructure Files

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Axios instance — attaches JWT from cookie, redirects on 401 |
| `src/lib/providers.tsx` | React Query + Sonner toaster (wraps the entire app) |
| `src/proxy.ts` | Next.js 16 route protection — checks `access_token` cookie |
| `src/store/authStore.ts` | Zustand — user session, `hasRole()` helper |
| `src/store/cartStore.ts` | Zustand — cart items, persisted to localStorage |
| `src/types/index.ts` | All TypeScript types derived from the data model |
| `.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## Architecture

```
Frontend (Next.js) ──REST API (JWT)──► Backend (Nest.js)
                                            │
                                  PostgreSQL / S3 / Stripe / NIUBIZ / YouTube
```

### Role-Based Routing

Five roles each have their own entry point after login:

| Role | Landing route | Access |
|------|--------------|--------|
| Visitante (guest) | `/` | Public catalog only |
| Estudiante | `/dashboard` | Enrolled courses, progress, certs |
| Soporte | `/soporte/cursos` | Full content management |
| Marketing | `/marketing/publicaciones` | Promotions & sliders |
| Administrador | `/admin/dashboard` | Everything + KPIs |

Admin inherits all Soporte + Marketing permissions.

### Key Route Groups

**Public:** `/`, `/cursos`, `/cursos/[slug]`, `/registro`, `/login`, `/recuperar-contraseña`, `/verificar/[uuid]`

**Student:** `/dashboard`, `/curso/[id]`, `/carrito`, `/checkout`, `/pedido/confirmacion/[order_id]`, `/perfil`, `/notificaciones`, `/certificado/[enrollment_id]`

**Soporte:** `/soporte/cursos`, `/soporte/cursos/nuevo`, `/soporte/cursos/[id]/editar`, `/soporte/cursos/[id]/contenido`, `/soporte/categorias`, `/soporte/matriculaciones`, `/soporte/certificados/plantillas`

**Marketing:** `/marketing/publicaciones`, `/marketing/sliders`

**Admin:** `/admin/dashboard`, `/admin/cursos/[id]/matriculados`, `/admin/estudiantes/[user_id]/cursos/[course_id]`

## Critical Business Rules

**Certificate flow** — A student cannot download a certificate without first submitting a review (1–5 stars + 50–500 char comment). This is enforced server-side; never skip or auto-bypass it in the UI.

**Video progress tracking** — YouTube Player API captures `watched_seconds` every 30 seconds via `PUT /api/progress/session/[id]`. Auto-completes a session when `watched_seconds >= duration_minutes * 60 * 0.9` (90%). Course progress = `(completed_sessions / total_sessions) * 100`. Respect YouTube API rate limits — this endpoint is called frequently.

**Cart persistence** — Logged-in users: cart stored in DB. Guests: localStorage (7-day TTL with `session_token`). On login, guest cart merges into user cart.

**Manual enrollment** — Soporte can enroll students without payment (creates `Enrollment` directly, no `Order`). Online purchase creates both `Order` + `Enrollment`.

**Soft deletes** — Courses and users use `deleted_at` timestamps. Enrolled students keep access to soft-deleted courses.

**Login lockout** — 5 failed attempts triggers a 15-minute lockout.

**Session duration** — "Remember me" checked → 30 days; unchecked → 24 hours.

## Data Model Overview

Core entities: `User`, `Category`, `Course`, `Instructor`, `Module`, `Session`, `Material`

Transactional: `Enrollment`, `Order`, `OrderItem`, `CartItem`, `LessonProgress`, `Review`, `Certificate`

Config/Marketing: `CertificateTemplate`, `Notification`, `Promotion`, `Slider`, `SliderCourse`, `AuditLog`

All PKs are UUIDs. Courses, Modules, Sessions, and Materials use `display_order` for drag-and-drop reordering. `AuditLog` records before/after JSON diffs for course edits.

## Phase Priorities

**Phase 1 MVP (MUST HAVE):** RF-001–003, RF-005–011, RF-013–027, RF-030–033, RF-035

**Phase 2 (SHOULD HAVE):** RF-004, RF-012, RF-028–029, RF-034, RF-036

**Phase 3 (COULD HAVE):** RF-037
