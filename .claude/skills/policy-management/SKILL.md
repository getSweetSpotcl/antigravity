---
name: policy-management
description: Gestión completa de pólizas de seguros. Usar cuando se trabaje con pólizas, endosos, renovaciones, o certificados.
---

# Skill: Policy Management

Este skill documenta la gestión de pólizas en GiCS, incluyendo endosos, renovaciones y relaciones con siniestros y comisiones.

## Modelo de Datos

```prisma
model Policy {
    id               String             @id @default(cuid())
    number           String             // POL-YYYY-XXXXX
    company          String             // Nombre de compañía
    companyId        String?            // Relación con InsuranceCompany
    type             PolicyType         // GENERAL, LIFE, AUTO, etc.
    status           PolicyStatus       @default(ACTIVE)

    // Vigencia
    startDate        DateTime
    endDate          DateTime

    // Montos
    premium          Decimal            // Prima neta
    commission       Decimal            // Comisión del corredor
    currency         String             @default("UF")

    // Detalles
    coverages        Json?              // Coberturas contratadas
    deductibles      Json?              // Deducibles
    insuredProperty  Json?              // Bien asegurado

    // Relaciones
    clientId         String
    tenantId         String
    quoteId          String?            @unique // Cotización origen

    claims           Claim[]
    commissions      Commission[]
    endorsements     Endorsement[]
    attachments      PolicyAttachment[]
    items            PolicyItem[]
}

model PolicyItem {
    id          String   @id @default(cuid())
    policyId    String
    itemNumber  Int
    description String
    value       Decimal
    currency    String   @default("UF")
    details     Json?
}
```

## Estados de Póliza

```
ACTIVE → EXPIRED (automático por fecha)
       → CANCELLED (por endoso de anulación)
       → RENEWED (nueva póliza creada)
```

| Estado | Descripción | Condición |
|--------|-------------|-----------|
| `ACTIVE` | Vigente | Fecha actual entre startDate y endDate |
| `EXPIRED` | Vencida | endDate < fecha actual |
| `CANCELLED` | Anulada | Endoso de tipo CANCELLATION |
| `RENEWED` | Renovada | Existe póliza de renovación |

## Tipos de Póliza

```typescript
enum PolicyType {
    GENERAL     // Seguros generales (incendio, RC, transporte)
    LIFE        // Seguros de vida
    HEALTH      // Seguros de salud
    AUTO        // Seguros automotrices
    HOME        // Seguros de hogar
    GUARANTEE   // Seguros de garantía
}

// Labels en español
const POLICY_TYPES_ES = {
    GENERAL: "Seguros Generales",
    LIFE: "Seguros de Vida",
    HEALTH: "Seguros de Salud",
    AUTO: "Seguros de Automóviles",
    HOME: "Seguros de Hogar",
    GUARANTEE: "Seguros de Garantía",
}
```

## Endosos (Endorsements)

Los endosos son modificaciones a una póliza vigente:

```prisma
model Endorsement {
    id            String          @id @default(cuid())
    number        String?         // END-XXXX
    type          EndorsementType
    description   String
    date          DateTime
    effectiveDate DateTime?       // Fecha efectiva del cambio
    premiumChange Decimal?        // Cambio en prima (+/-)
    notes         String?
    policyId      String
}

enum EndorsementType {
    GENERAL_MODIFICATION  // Cambio de datos
    RENEWAL               // Renovación
    CANCELLATION          // Anulación
    INCLUSION             // Agregar cobertura/item
    EXCLUSION             // Quitar cobertura/item
}
```

### Crear Endoso

```typescript
export const createEndorsement = async (values: EndorsementSchema) => {
    const tenantId = await getTenantContext()

    // Verificar que la póliza pertenece al tenant
    const policy = await prisma.policy.findUnique({
        where: { id: values.policyId },
    })
    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    // Crear endoso
    const endorsement = await prisma.endorsement.create({
        data: {
            ...values,
            number: generateEndorsementNumber(),
        },
    })

    // Si es anulación, actualizar estado de póliza
    if (values.type === "CANCELLATION") {
        await prisma.policy.update({
            where: { id: values.policyId },
            data: { status: "CANCELLED" },
        })
    }

    revalidatePath(`/dashboard/policies/${values.policyId}`)
    return { success: "Endoso creado" }
}
```

## Renovaciones

El proceso de renovación:

1. Detectar pólizas próximas a vencer (30 días)
2. Crear alerta para el corredor
3. Generar cotización de renovación
4. Cliente acepta → crear nueva póliza
5. Marcar póliza anterior como RENEWED

```typescript
// Detectar pólizas por vencer
const expiringPolicies = await prisma.policy.findMany({
    where: {
        tenantId,
        status: "ACTIVE",
        endDate: {
            gte: new Date(),
            lte: addDays(new Date(), 30),
        },
    },
})
```

## Server Actions

### Obtener Pólizas

```typescript
export const getPolicies = async () => {
    const tenantId = await getTenantContext()

    return prisma.policy.findMany({
        where: { tenantId },
        include: {
            client: true,
            insuranceCompany: true,
            endorsements: { orderBy: { date: "desc" } },
            claims: true,
            _count: { select: { claims: true, endorsements: true } },
        },
        orderBy: { createdAt: "desc" },
    })
}
```

### Crear Póliza Manual

```typescript
export const createPolicy = async (values: PolicySchema) => {
    const tenantId = await getTenantContext()

    const policy = await prisma.policy.create({
        data: {
            number: generatePolicyNumber(),
            ...values,
            tenantId,
        },
    })

    // Crear comisiones si corresponde
    if (values.commission > 0) {
        await createCommissionsForPolicy(policy.id, values.commission)
    }

    revalidatePath("/dashboard/policies")
    return { success: "Póliza creada" }
}
```

### Actualizar Estado

```typescript
export const updatePolicyStatus = async (id: string, status: PolicyStatus) => {
    // Verificaciones de tenant
    // Actualizar estado
    // Si se cancela, cancelar comisiones pendientes
}
```

## Indicadores de Alerta

En la UI, mostrar alertas para:
- Pólizas próximas a vencer (≤30 días)
- Pólizas vencidas
- Pólizas con siniestros abiertos

```tsx
const daysUntilExpiry = differenceInDays(policy.endDate, new Date())
const isExpiringSoon = policy.status === "ACTIVE" && daysUntilExpiry <= 30 && daysUntilExpiry > 0

{isExpiringSoon && (
    <AlertTriangle className="h-4 w-4 text-amber-600" />
)}
```

## Componentes Principales

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `PolicyList` | `components/policies/policy-list.tsx` | Lista con filtros |
| `CreatePolicyDialog` | `components/policies/create-policy-dialog.tsx` | Crear manual |
| `EndorsementList` | `components/policies/endorsements/endorsement-list.tsx` | Lista endosos |
| `CreateEndorsementDialog` | `components/policies/endorsements/create-endorsement-dialog.tsx` | Crear endoso |

## Cálculo de Comisiones

Al crear una póliza desde cotización:

```typescript
const commissionPercentage = quote.commissionPercentage || 0
const commission = premium * (commissionPercentage / 100)

// Si hay cuotas de pago
const installments = quote.paymentInstallments || 1
const commissionPerInstallment = commission / installments
```

## Archivos de Referencia

- `schemas/policy.ts` - Schema de validación
- `schemas/endorsement.ts` - Schema de endosos
- `actions/policy.ts` - Server actions
- `actions/endorsement.ts` - Actions de endosos
- `app/dashboard/policies/page.tsx` - Listado
- `app/dashboard/policies/[id]/page.tsx` - Detalle
