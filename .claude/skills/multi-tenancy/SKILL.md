---
name: multi-tenancy
description: Patrón de multi-tenancy para asegurar aislamiento de datos por tenant. Usar en cualquier operación de base de datos o acceso a recursos.
---

# Skill: Multi-Tenancy

Este skill documenta el patrón de multi-tenancy de GiCS para asegurar el aislamiento completo de datos entre corredoras (tenants).

## Arquitectura

GiCS usa un modelo de **single-database multi-tenant**:
- Una base de datos PostgreSQL compartida
- Todas las tablas principales tienen `tenantId` como foreign key
- El contexto de tenant se obtiene de la sesión del usuario

## Obtener Contexto de Tenant

**Archivo**: `lib/tenant-context.ts`

```typescript
import { getTenantContext } from "@/lib/tenant-context"

// En cualquier server action o API route
const tenantId = await getTenantContext()

if (!tenantId) {
    // Usuario no autenticado o sin tenant asignado
    return { error: "No autorizado" }
}
```

### Cómo funciona getTenantContext

```typescript
// lib/tenant-context.ts
export async function getTenantContext(): Promise<string | null> {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    // SUPER_ADMIN puede cambiar de tenant via cookie
    if (session.user.role === "SUPER_ADMIN") {
        const cookies = await import("next/headers").then(m => m.cookies())
        const adminTenantId = cookies().get("admin-tenant-context")?.value
        if (adminTenantId) {
            return adminTenantId
        }
    }

    // Usuarios normales usan su tenantId de sesión
    return session.user.tenantId || null
}
```

## Roles de Usuario

```typescript
enum UserRole {
    SUPER_ADMIN      // Admin de plataforma, puede ver todos los tenants
    BROKERAGE_ADMIN  // Admin de una corredora específica
    AGENT            // Agente de una corredora
}
```

### Verificación de Roles

```typescript
import { auth } from "@/lib/auth"

const session = await auth()

if (session?.user.role === "SUPER_ADMIN") {
    // Acceso total a la plataforma
}

if (session?.user.role === "BROKERAGE_ADMIN") {
    // Puede gestionar usuarios de su tenant
}
```

## Patrones de Consulta

### READ - Filtrar por Tenant

```typescript
// SIEMPRE filtrar por tenantId en queries
const policies = await prisma.policy.findMany({
    where: {
        tenantId: tenantId,  // OBLIGATORIO
        status: "ACTIVE",
    },
})
```

### CREATE - Incluir Tenant

```typescript
// SIEMPRE incluir tenantId al crear
const policy = await prisma.policy.create({
    data: {
        number: "POL-2024-001",
        tenantId: tenantId,  // OBLIGATORIO
        // ... otros campos
    },
})
```

### UPDATE/DELETE - Verificar Pertenencia

```typescript
// SIEMPRE verificar que el registro pertenece al tenant
const existing = await prisma.policy.findUnique({
    where: { id },
})

if (!existing || existing.tenantId !== tenantId) {
    return { error: "No encontrado" }
}

// Solo entonces actualizar/eliminar
await prisma.policy.update({
    where: { id },
    data: { status: "CANCELLED" },
})
```

## Modelos con tenantId

Las siguientes entidades DEBEN tener `tenantId`:

| Modelo | Relación con Tenant |
|--------|---------------------|
| `Client` | Directo |
| `Policy` | Directo |
| `Quote` | Directo |
| `Claim` | Directo |
| `Commission` | Via Policy |
| `InsuranceCompany` | Directo |
| `User` | Directo |
| `AuditLog` | Directo |

### Entidades sin tenantId

Estas entidades se relacionan con el tenant a través de su padre:

| Modelo | Se obtiene tenant via |
|--------|----------------------|
| `PolicyItem` | `policy.tenantId` |
| `Endorsement` | `policy.tenantId` |
| `QuoteAttachment` | `quote.tenantId` |
| `ClaimHistory` | `claim.tenantId` |
| `CommissionPayment` | `commission.policy.tenantId` |

```typescript
// Verificar tenant de entidad hija
const attachment = await prisma.quoteAttachment.findUnique({
    where: { id: attachmentId },
    include: { quote: true },
})

if (!attachment || attachment.quote.tenantId !== tenantId) {
    return { error: "No encontrado" }
}
```

## SUPER_ADMIN - Cambio de Contexto

El SUPER_ADMIN puede "impersonar" un tenant para soporte:

```typescript
// Establecer contexto de admin (en cliente)
import { cookies } from "next/headers"

// Solo SUPER_ADMIN puede hacer esto
cookies().set("admin-tenant-context", targetTenantId)

// Para volver a vista global
cookies().delete("admin-tenant-context")
```

## Seguridad - Checklist

Al crear cualquier nueva funcionalidad, verificar:

- [ ] ¿La action usa `getTenantContext()`?
- [ ] ¿Las queries filtran por `tenantId`?
- [ ] ¿Los creates incluyen `tenantId`?
- [ ] ¿Los updates/deletes verifican pertenencia?
- [ ] ¿Las entidades hijas verifican tenant del padre?
- [ ] ¿Los API routes verifican tenant?

## API Routes

```typescript
// app/api/something/route.ts
import { NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant-context"

export async function GET() {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
        )
    }

    // Proceder con tenantId...
}
```

## Cron Jobs / Automatizaciones

Para jobs que procesan múltiples tenants:

```typescript
// app/api/cron/process-renewals/route.ts
export async function GET(req: Request) {
    // Verificar autorización del cron
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 })
    }

    // Obtener todos los tenants activos
    const tenants = await prisma.tenant.findMany({
        where: { subscriptionStatus: "ACTIVE" },
    })

    // Procesar cada tenant
    for (const tenant of tenants) {
        await processRenewalsForTenant(tenant.id)
    }
}

async function processRenewalsForTenant(tenantId: string) {
    const policies = await prisma.policy.findMany({
        where: {
            tenantId,  // Scope por tenant
            status: "ACTIVE",
            // ...
        },
    })
    // Procesar...
}
```

## Archivos de Referencia

- `lib/tenant-context.ts` - Implementación de getTenantContext
- `lib/auth.ts` - Configuración de NextAuth con tenant
- `actions/quote.ts` - Ejemplo completo de uso
- `middleware.ts` - Protección de rutas
