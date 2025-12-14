---
name: commissions-system
description: Sistema de comisiones del corredor. Usar cuando se trabaje con cálculo, seguimiento, o cobro de comisiones.
---

# Skill: Commissions System

Este skill documenta el sistema de comisiones en GiCS, desde el cálculo hasta el cobro.

## Modelo de Datos

```prisma
model Commission {
    id                String              @id @default(cuid())
    policyId          String

    // Cálculo
    percentage        Decimal             // % de comisión
    baseAmount        Decimal             // Prima sobre la que se calcula
    amount            Decimal             // Monto total de comisión
    currency          String              @default("UF")

    // Estado de cobro
    status            CommissionStatus    @default(PENDING)
    paidAmount        Decimal             @default(0)
    pendingAmount     Decimal             // amount - paidAmount

    // Fechas
    dueDate           DateTime?           // Fecha esperada de cobro
    paidDate          DateTime?           // Fecha de cobro completo
    periodStart       DateTime?           // Inicio del periodo
    periodEnd         DateTime?           // Fin del periodo

    // Cuotas
    installment       Int?                // Número de cuota
    totalInstallments Int?                // Total de cuotas

    notes             String?
    tenantId          String

    // Relaciones
    policy            Policy              @relation
    payments          CommissionPayment[]
}

model CommissionPayment {
    id             String        @id @default(cuid())
    commissionId   String
    amount         Decimal       // Monto pagado
    currency       String        @default("UF")
    paymentDate    DateTime
    paymentMethod  PaymentMethod // TRANSFER, CHECK, CASH, etc.
    reference      String?       // Número de transferencia/cheque
    bankName       String?
    accountNumber  String?
    receiptUrl     String?       // Comprobante
    notes          String?
    recordedBy     String?
    recordedByName String?
}

enum CommissionStatus {
    PENDING    // Pendiente de cobro
    PARTIAL    // Parcialmente cobrada
    PAID       // Completamente cobrada
    OVERDUE    // Vencida sin cobrar
    CANCELLED  // Cancelada (póliza anulada)
}

enum PaymentMethod {
    TRANSFER
    CHECK
    CASH
    CREDIT_CARD
    OTHER
}
```

## Flujo de Comisiones

### 1. Creación
Cuando se crea una póliza (desde cotización o manual):

```typescript
async function createCommissionsForPolicy(
    policyId: string,
    commission: number,
    installments: number = 1
) {
    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { tenant: true },
    })

    const installmentAmount = commission / installments
    const startDate = policy.startDate

    // Crear una comisión por cada cuota
    for (let i = 1; i <= installments; i++) {
        const dueDate = addMonths(startDate, i - 1) // Mensual

        await prisma.commission.create({
            data: {
                policyId,
                percentage: policy.quote?.commissionPercentage || 0,
                baseAmount: policy.premium,
                amount: installmentAmount,
                pendingAmount: installmentAmount,
                currency: policy.currency,
                status: "PENDING",
                dueDate,
                installment: installments > 1 ? i : null,
                totalInstallments: installments > 1 ? installments : null,
                tenantId: policy.tenantId,
            },
        })
    }
}
```

### 2. Seguimiento
- Mostrar comisiones pendientes en dashboard
- Alertar sobre comisiones vencidas
- Filtrar por estado, fecha, póliza

### 3. Registro de Pago

```typescript
export const recordCommissionPayment = async (
    commissionId: string,
    payment: PaymentData
) => {
    const tenantId = await getTenantContext()

    const commission = await prisma.commission.findUnique({
        where: { id: commissionId },
        include: { policy: true },
    })

    if (commission.policy.tenantId !== tenantId) {
        return { error: "No autorizado" }
    }

    const session = await auth()

    // Crear registro de pago
    await prisma.commissionPayment.create({
        data: {
            commissionId,
            amount: payment.amount,
            paymentDate: payment.date,
            paymentMethod: payment.method,
            reference: payment.reference,
            bankName: payment.bankName,
            receiptUrl: payment.receiptUrl,
            notes: payment.notes,
            recordedBy: session?.user?.id,
            recordedByName: session?.user?.name,
        },
    })

    // Actualizar comisión
    const newPaidAmount = Number(commission.paidAmount) + payment.amount
    const newPendingAmount = Number(commission.amount) - newPaidAmount
    const newStatus = newPendingAmount <= 0 ? "PAID" : "PARTIAL"

    await prisma.commission.update({
        where: { id: commissionId },
        data: {
            paidAmount: newPaidAmount,
            pendingAmount: Math.max(0, newPendingAmount),
            status: newStatus,
            paidDate: newStatus === "PAID" ? new Date() : undefined,
        },
    })

    revalidatePath("/dashboard/commissions")
    return { success: "Pago registrado" }
}
```

### 4. Cancelación
Si una póliza se cancela, las comisiones pendientes se cancelan:

```typescript
async function cancelPendingCommissions(policyId: string) {
    await prisma.commission.updateMany({
        where: {
            policyId,
            status: { in: ["PENDING", "PARTIAL"] },
        },
        data: {
            status: "CANCELLED",
        },
    })
}
```

## Server Actions

### Obtener Resumen

```typescript
export const getCommissionsSummary = async () => {
    const tenantId = await getTenantContext()

    // Pendientes
    const pending = await prisma.commission.aggregate({
        where: { tenantId, status: "PENDING" },
        _sum: { pendingAmount: true },
        _count: true,
    })

    // Vencidas
    const overdue = await prisma.commission.aggregate({
        where: {
            tenantId,
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { lt: new Date() },
        },
        _sum: { pendingAmount: true },
        _count: true,
    })

    // Próximos vencimientos
    const upcomingDue = await prisma.commission.findMany({
        where: {
            tenantId,
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: {
                gte: new Date(),
                lte: addDays(new Date(), 7),
            },
        },
        include: {
            policy: {
                include: {
                    client: true,
                    insuranceCompany: true,
                },
            },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
    })

    return {
        pending: { count: pending._count, amount: pending._sum.pendingAmount },
        overdue: { count: overdue._count, amount: overdue._sum.pendingAmount },
        upcomingDue,
    }
}
```

### Obtener Lista

```typescript
export const getCommissions = async (filters?: CommissionFilters) => {
    const tenantId = await getTenantContext()

    return prisma.commission.findMany({
        where: {
            tenantId,
            status: filters?.status,
            dueDate: filters?.dueDateRange,
            policy: filters?.policyId ? { id: filters.policyId } : undefined,
        },
        include: {
            policy: {
                include: {
                    client: true,
                    insuranceCompany: true,
                },
            },
            payments: { orderBy: { paymentDate: "desc" } },
        },
        orderBy: { dueDate: "asc" },
    })
}
```

## Dashboard Widget

El widget de comisiones muestra:
- Total pendiente (UF)
- Total vencido (UF)
- Próximos 5 vencimientos

```tsx
<CommissionsWidget summary={summary} />
```

Estructura visual:
- Dos boxes con gradientes (pendiente amber, vencido red)
- Lista de próximos vencimientos con días restantes
- Badge "Hoy", "Mañana", o "X días"

## Estados y Colores

```typescript
const commissionStatusConfig = {
    PENDING: {
        label: "Pendiente",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500"
    },
    PARTIAL: {
        label: "Parcial",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500"
    },
    PAID: {
        label: "Cobrada",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500"
    },
    OVERDUE: {
        label: "Vencida",
        color: "bg-red-100 text-red-700 border-red-200",
        dot: "bg-red-500"
    },
    CANCELLED: {
        label: "Cancelada",
        color: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400"
    },
}
```

## Cálculos

### Comisión desde Cotización

```typescript
// Al crear póliza desde cotización
const commissionPercentage = quote.commissionPercentage || 15 // Default 15%
const commission = Number(quote.totalPremium) * (commissionPercentage / 100)
```

### División en Cuotas

```typescript
const installments = quote.paymentInstallments || 1
const commissionPerInstallment = commission / installments

// Fecha de vencimiento: inicio + (n-1) meses
const dueDate = addMonths(policy.startDate, installmentNumber - 1)
```

## Reportes

### Estado de Cuenta
Genera PDF con:
- Comisiones pendientes por póliza
- Historial de pagos
- Totales por periodo

## Componentes Principales

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `CommissionsWidget` | `components/dashboard/commissions-widget.tsx` | Widget dashboard |
| `CommissionList` | `components/commissions/commission-list.tsx` | Lista completa |
| `RecordPaymentDialog` | `components/commissions/record-payment-dialog.tsx` | Registrar pago |
| `CommissionDetail` | Página detalle | Vista con pagos |

## Archivos de Referencia

- `schemas/commission.ts` - Schema de validación
- `actions/commission.ts` - Server actions
- `app/dashboard/commissions/page.tsx` - Listado
- `components/dashboard/commissions-widget.tsx` - Widget
