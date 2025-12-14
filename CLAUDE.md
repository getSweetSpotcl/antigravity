# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Antigravity is a multi-tenant insurance brokerage management system built for the Chilean market. It manages quotes, policies, claims, clients, and insurance companies for brokerage firms (corredoras de seguros).

## Commands

```bash
npm run dev          # Start development server (Next.js)
npm run build        # Generate Prisma client and build for production
npm run lint         # Run ESLint
npx prisma migrate dev    # Run database migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open Prisma Studio GUI
npx tsx scripts/create-superadmin.ts  # Create initial admin user
```

## Architecture

### Multi-Tenancy

The app uses a single-database multi-tenant architecture:
- **Tenant**: Represents a brokerage company. All data (clients, policies, quotes, claims) is scoped to a tenant via `tenantId` foreign keys
- **getTenantContext()** (`lib/tenant-context.ts`): Returns the current tenant ID from session, or from a cookie for SUPER_ADMIN users who can impersonate tenants
- All server actions must call `getTenantContext()` to ensure proper data isolation

### User Roles

Defined in `prisma/schema.prisma`:
- `SUPER_ADMIN`: Platform-level admin, can switch between tenants
- `BROKERAGE_ADMIN`: Admin for a specific brokerage
- `AGENT`: Regular user within a brokerage

### Authentication

Uses NextAuth v5 (beta) with:
- Credentials provider (email/password with bcryptjs)
- JWT session strategy
- Prisma adapter for database integration
- Auth config split between `auth.config.ts` (edge-compatible) and `lib/auth.ts` (with Prisma)
- Extended session types in `types/next-auth.d.ts` include `role` and `tenantId`

### Server Actions

Located in `actions/` directory. Pattern:
```typescript
"use server"
import { getTenantContext } from "@/lib/tenant-context"

export const someAction = async (data: SchemaType) => {
    const tenantId = await getTenantContext()
    if (!tenantId) throw new Error("No autorizado")
    // ... perform action with tenantId filter
    revalidatePath("/relevant/path")
}
```

### Validation Schemas

Zod schemas in `schemas/` directory. Each domain has its own file (quote.ts, policy.ts, claim.ts, client.ts, endorsement.ts).

### UI Components

- Built with Radix UI primitives + Tailwind CSS
- Component library in `components/ui/` (shadcn/ui style)
- Feature components organized by domain: `components/quotes/`, `components/policies/`, `components/claims/`, etc.
- Uses react-hook-form with @hookform/resolvers for form handling

### Key Domain Models

- **Quote** → **Policy**: Quotes can become policies when accepted
- **Policy** → **Claim**: Policies can have claims
- **Policy** → **Endorsement**: Policies can have modifications/endorsements
- **Client**: Has RUT (Chilean tax ID), can have multiple policies/quotes
- **InsuranceCompany**: Companies that underwrite policies, scoped per tenant

### Path Aliases

`@/*` maps to project root (configured in tsconfig.json)

## Chilean-Specific

- **RUT**: Chilean tax identification number (format: XX.XXX.XXX-X). Validation utilities in `lib/rut-utils.ts`
- **UF**: Unidad de Fomento, Chilean inflation-indexed currency unit. Default currency for policies
- UI text is in Spanish

## Plans & Documentation

Los planes de desarrollo se encuentran en `.claude/plans/`:
- `development-plan.md` - Roadmap general del proyecto
- `list-improvements-plan.md` - Plan de mejoras para DataTables

## Project Status (Diciembre 2024)

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1-4 | Core (Auth, Pólizas, Renovaciones, Siniestros) | 100% |
| 5 | Comisiones | 95% |
| 6 | Portal de Clientes | 85% |
| 7 | Documentos PDF | 90% |
| 8 | Reportes | 85% |
| 9 | Búsqueda y UX | 85% |
| 10 | Testing | 35% |

**Completitud general: ~82%**

### Recientes implementaciones:
**Sprint UX:**
- Dark mode con toggle y persistencia (`components/theme-provider.tsx`, `hooks/use-theme.ts`)
- Gráficos en reportes con Recharts (`components/reports/charts/`)
- Dashboard con soporte dark mode y componente StatCard reutilizable

**Sprint Testing:**
- Tests para schemas de autenticación (`__tests__/schemas/auth.test.ts`)
- Tests para action de registro (`__tests__/actions/register.test.ts`)
- Tests para actions de pólizas (`__tests__/actions/policy.test.ts`)
- 112 tests totales pasando

## Testing

```bash
npm run test:run     # Ejecutar tests
npm run test:watch   # Tests en modo watch
```

Tests ubicados en `__tests__/` con Vitest configurado.
