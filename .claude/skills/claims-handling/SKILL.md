---
name: claims-handling
description: Gestión de siniestros de seguros. Usar cuando se trabaje con reportes de siniestros, seguimiento, o liquidaciones.
---

# Skill: Claims Handling

Este skill documenta la gestión de siniestros en GiCS, desde el reporte inicial hasta el cierre.

## Modelo de Datos

```prisma
model Claim {
    id                    String            @id @default(cuid())
    number                String?           // SIN-YYYY-XXXXX
    description           String            // Descripción del siniestro
    status                ClaimStatus       @default(REPORTED)
    date                  DateTime          // Fecha del siniestro

    // Montos
    claimAmount           Decimal?          // Monto reclamado
    reserveAmount         Decimal?          // Reserva técnica
    approvedAmount        Decimal?          // Monto aprobado
    paidAmount            Decimal?          // Monto pagado
    currency              String            @default("UF")

    // Ajustador
    adjusterName          String?
    adjusterCompany       String?
    adjusterEmail         String?
    adjusterPhone         String?
    adjustmentDate        DateTime?

    // Fechas clave
    reportedToCompanyDate DateTime?         // Fecha reporte a compañía
    resolutionDate        DateTime?         // Fecha de resolución

    // Notas
    internalNotes         String?

    // Relaciones
    policyId              String
    tenantId              String
    attachments           ClaimAttachment[]
    history               ClaimHistory[]
}

model ClaimHistory {
    id          String   @id @default(cuid())
    claimId     String
    action      String   // Estado anterior → nuevo
    description String   // Descripción del cambio
    oldValue    String?  // Valor anterior (JSON)
    newValue    String?  // Valor nuevo (JSON)
    userId      String?  // Quien hizo el cambio
    userName    String?
    createdAt   DateTime @default(now())
}
```

## Estados del Siniestro

```
REPORTED → IN_PROCESS → APPROVED → CLOSED
                     ↘ REJECTED → CLOSED
```

| Estado | Descripción | Color UI |
|--------|-------------|----------|
| `REPORTED` | Recién reportado | Amber |
| `IN_PROCESS` | En proceso con compañía | Blue (pulse) |
| `APPROVED` | Aprobado por compañía | Emerald |
| `REJECTED` | Rechazado por compañía | Red |
| `CLOSED` | Cerrado (pagado o archivado) | Slate |

## Flujo de Siniestro

### 1. Reporte Inicial (REPORTED)
- Cliente reporta siniestro
- Se registra descripción y fecha
- Se adjuntan documentos iniciales (fotos, denuncia)
- Estado: REPORTED

### 2. Proceso con Compañía (IN_PROCESS)
- Notificar a compañía aseguradora
- Asignar ajustador si corresponde
- Registrar monto reclamado
- Establecer reserva técnica
- Estado: IN_PROCESS

### 3. Resolución
- Compañía aprueba o rechaza
- Si aprueba: registrar monto aprobado
- Si rechaza: registrar motivo
- Estado: APPROVED o REJECTED

### 4. Cierre (CLOSED)
- Si aprobado: registrar pago
- Cerrar siniestro
- Estado: CLOSED

## Server Actions

### Crear Siniestro

```typescript
export const createClaim = async (values: ClaimSchema) => {
    const tenantId = await getTenantContext()

    // Verificar que la póliza pertenece al tenant y está activa
    const policy = await prisma.policy.findUnique({
        where: { id: values.policyId },
    })
    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }
    if (policy.status !== "ACTIVE") {
        return { error: "La póliza no está vigente" }
    }

    const claim = await prisma.claim.create({
        data: {
            number: generateClaimNumber(),
            description: values.description,
            date: values.date,
            claimAmount: values.claimAmount,
            policyId: values.policyId,
            tenantId,
            status: "REPORTED",
        },
    })

    // Registrar en historial
    await logClaimHistory(claim.id, "CREATE", "Siniestro reportado")

    revalidatePath(`/dashboard/policies/${values.policyId}`)
    revalidatePath("/dashboard/claims")
    return { success: "Siniestro reportado", claimId: claim.id }
}
```

### Actualizar Estado

```typescript
export const updateClaimStatus = async (
    id: string,
    status: ClaimStatus,
    data?: { approvedAmount?: number; rejectionReason?: string }
) => {
    const tenantId = await getTenantContext()

    const claim = await prisma.claim.findUnique({ where: { id } })
    if (!claim || claim.tenantId !== tenantId) {
        return { error: "Siniestro no encontrado" }
    }

    const oldStatus = claim.status

    await prisma.claim.update({
        where: { id },
        data: {
            status,
            approvedAmount: data?.approvedAmount,
            resolutionDate: ["APPROVED", "REJECTED"].includes(status)
                ? new Date()
                : undefined,
        },
    })

    // Registrar cambio en historial
    await logClaimHistory(
        id,
        "STATUS_CHANGE",
        `Estado cambiado de ${oldStatus} a ${status}`,
        { oldStatus },
        { newStatus: status, ...data }
    )

    revalidatePath(`/dashboard/claims/${id}`)
    return { success: "Estado actualizado" }
}
```

### Registrar Pago

```typescript
export const recordClaimPayment = async (
    id: string,
    paidAmount: number
) => {
    await prisma.claim.update({
        where: { id },
        data: {
            paidAmount,
            status: "CLOSED",
        },
    })

    await logClaimHistory(id, "PAYMENT", `Pago registrado: ${paidAmount}`)

    return { success: "Pago registrado" }
}
```

## Historial de Cambios

Todos los cambios se registran automáticamente:

```typescript
async function logClaimHistory(
    claimId: string,
    action: string,
    description: string,
    oldValues?: object,
    newValues?: object
) {
    const session = await auth()

    await prisma.claimHistory.create({
        data: {
            claimId,
            action,
            description,
            oldValue: oldValues ? JSON.stringify(oldValues) : null,
            newValue: newValues ? JSON.stringify(newValues) : null,
            userId: session?.user?.id,
            userName: session?.user?.name,
        },
    })
}
```

## Archivos Adjuntos

Tipos comunes de adjuntos en siniestros:
- Denuncia policial
- Fotos del daño
- Presupuestos de reparación
- Facturas
- Informe de ajustador
- Liquidación de compañía

```typescript
export const addClaimAttachment = async (
    claimId: string,
    fileData: FileData,
    description?: string
) => {
    await prisma.claimAttachment.create({
        data: {
            claimId,
            fileName: fileData.name,
            fileUrl: fileData.url,
            fileType: fileData.type,
            fileSize: fileData.size,
            description,
        },
    })
}
```

## Indicadores Clave

### En Dashboard
- Siniestros reportados (sin procesar)
- Siniestros en proceso
- Monto total en reservas

### En Lista
- Status badge con colores semánticos
- IN_PROCESS con animación pulse
- Días desde reporte
- Montos (reclamado, aprobado, pagado)

```tsx
const statusConfig = {
    REPORTED: {
        label: "Reportado",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500"
    },
    IN_PROCESS: {
        label: "En Proceso",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500 status-pulse" // Animación
    },
    APPROVED: {
        label: "Aprobado",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500"
    },
    REJECTED: {
        label: "Rechazado",
        color: "bg-red-100 text-red-700 border-red-200",
        dot: "bg-red-500"
    },
    CLOSED: {
        label: "Cerrado",
        color: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400"
    },
}
```

## Componentes Principales

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `ClaimList` | `components/claims/claim-list.tsx` | Lista de siniestros |
| `CreateClaimDialog` | `components/claims/create-claim-dialog.tsx` | Reportar siniestro |
| `ClaimDetailView` | Página de detalle | Vista completa |
| `ClaimHistory` | En detalle | Historial de cambios |

## Archivos de Referencia

- `schemas/claim.ts` - Schema de validación
- `actions/claim.ts` - Server actions
- `app/dashboard/claims/page.tsx` - Listado
- `app/dashboard/claims/[id]/page.tsx` - Detalle
