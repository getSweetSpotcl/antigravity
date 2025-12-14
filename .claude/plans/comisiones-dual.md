# Plan: Sistema de Comisiones Dual (Corredora + Vendedores)

## Objetivo
Reformular el sistema de comisiones para manejar dos tipos:
1. **Comisión de Corredora**: Lo que la aseguradora paga a la corredora
2. **Comisión de Vendedor**: Lo que la corredora paga a sus vendedores (% de la comisión recibida)

## Decisiones de Diseño (confirmadas por usuario)
- **Asignación de vendedor**: Campo opcional en cotización Y póliza
- **Porcentaje de comisión**: Por defecto en perfil del vendedor, modificable por póliza
- **Generación**: Automática al generar comisión de corredora (si hay vendedor asignado)
- **Pagos**: Independientes (vendedor puede recibir pago antes de que corredora cobre)

---

## Cambios en Base de Datos

### 1. Modificar modelo User (agregar campos de vendedor)
```prisma
model User {
  // ... campos existentes ...
  defaultCommissionPercentage Decimal?  @db.Decimal(5, 2)  // % comisión por defecto
  bankName                    String?
  bankAccountNumber           String?
  bankAccountType             String?   // "corriente" | "vista"

  AssignedQuotes      Quote[]           @relation("AgentQuotes")
  AssignedPolicies    Policy[]          @relation("AgentPolicies")
  AgentCommission     AgentCommission[] @relation("AgentCommissions")
}
```

### 2. Modificar modelo Quote (agregar agentId)
```prisma
model Quote {
  // ... campos existentes ...
  agentId    String?
  Agent      User?    @relation("AgentQuotes", fields: [agentId], references: [id])
}
```

### 3. Modificar modelo Policy (agregar agentId)
```prisma
model Policy {
  // ... campos existentes ...
  agentId           String?
  Agent             User?             @relation("AgentPolicies", fields: [agentId], references: [id])
  AgentCommission   AgentCommission[]
}
```

### 4. Nuevo modelo AgentCommission
```prisma
model AgentCommission {
  id                    String   @id @default(cuid())
  commissionId          String   // FK a Commission (corredora)
  policyId              String
  agentId               String
  percentage            Decimal  @db.Decimal(5, 2)
  baseAmount            Decimal  @db.Decimal(12, 2)  // Monto comisión corredora
  amount                Decimal  @db.Decimal(12, 2)  // Monto calculado vendedor
  currency              String   @default("UF")
  status                CommissionStatus @default(PENDING)
  paidAmount            Decimal  @default(0) @db.Decimal(12, 2)
  pendingAmount         Decimal  @db.Decimal(12, 2)
  dueDate               DateTime?
  paidDate              DateTime?
  notes                 String?
  tenantId              String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  Commission            Commission @relation(fields: [commissionId], references: [id], onDelete: Cascade)
  Policy                Policy     @relation(fields: [policyId], references: [id])
  Agent                 User       @relation("AgentCommissions", fields: [agentId], references: [id])
  AgentCommissionPayment AgentCommissionPayment[]

  @@index([commissionId])
  @@index([policyId])
  @@index([agentId])
  @@index([tenantId])
  @@index([status])
}
```

### 5. Nuevo modelo AgentCommissionPayment
```prisma
model AgentCommissionPayment {
  id                  String   @id @default(cuid())
  agentCommissionId   String
  amount              Decimal  @db.Decimal(12, 2)
  currency            String   @default("UF")
  paymentDate         DateTime
  paymentMethod       PaymentMethod
  reference           String?
  bankName            String?
  accountNumber       String?
  notes               String?
  recordedBy          String?
  recordedByName      String?
  createdAt           DateTime @default(now())

  AgentCommission     AgentCommission @relation(fields: [agentCommissionId], references: [id], onDelete: Cascade)

  @@index([agentCommissionId])
  @@index([paymentDate])
}
```

### 6. Modificar modelo Commission (agregar relación)
```prisma
model Commission {
  // ... campos existentes ...
  AgentCommission   AgentCommission[]
}
```

---

## Archivos a Crear/Modificar

### Nuevos Archivos
| Archivo | Descripción |
|---------|-------------|
| `schemas/agent-commission.ts` | Schemas Zod para validación |
| `actions/agent-commission.ts` | Server actions CRUD |
| `components/commissions/agent-commission-list.tsx` | Lista de comisiones vendedor |
| `components/commissions/register-agent-payment-dialog.tsx` | Registrar pago a vendedor |
| `components/commissions/agent-selector.tsx` | Selector de vendedor reutilizable |
| `app/dashboard/commissions/agents/page.tsx` | Página lista comisiones vendedor |
| `app/dashboard/commissions/agents/[id]/page.tsx` | Detalle comisión vendedor |

### Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Nuevos modelos y relaciones |
| `actions/commission.ts` | Integrar generación automática de AgentCommission |
| `actions/quote.ts` | Agregar agentId a createQuote |
| `actions/policy.ts` | Agregar agentId a createPolicy |
| `actions/user.ts` | getAgents(), updateAgentSettings() |
| `components/quotes/create-quote-dialog.tsx` | Selector de vendedor |
| `components/policies/create-policy-dialog.tsx` | Selector de vendedor |
| `components/commissions/commission-list.tsx` | Mostrar comisiones vendedor vinculadas |
| `app/dashboard/commissions/page.tsx` | Tabs o navegación a comisiones vendedor |

---

## Server Actions Nuevos (`actions/agent-commission.ts`)

```typescript
// CRUD básico
getAgentCommissions(filters?)
getAgentCommissionById(id)
updateAgentCommission(id, values)
cancelAgentCommission(id)

// Pagos
registerAgentCommissionPayment(values)
deleteAgentCommissionPayment(paymentId)

// Estadísticas
getAgentCommissionStats(agentId?, period?)
getAgentCommissionsDashboardSummary()

// Por vendedor
getAgentCommissionsByAgentId(agentId)
```

## Modificar `actions/commission.ts`

En `generateCommissionsFromPolicy()`:
```typescript
// Después de crear cada Commission de corredora:
if (policy.agentId && policy.Agent?.defaultCommissionPercentage) {
  await createAgentCommission({
    commissionId: newCommission.id,
    policyId: policy.id,
    agentId: policy.agentId,
    percentage: policy.Agent.defaultCommissionPercentage,
    baseAmount: newCommission.amount,
  })
}
```

---

## Fases de Implementación

### Fase 1: Base de Datos
1. Agregar campos a User (defaultCommissionPercentage, bank info)
2. Agregar agentId a Quote y Policy
3. Crear modelo AgentCommission
4. Crear modelo AgentCommissionPayment
5. Agregar relación Commission → AgentCommission
6. `npx prisma db push`

### Fase 2: Backend Core
1. Crear `schemas/agent-commission.ts`
2. Crear `actions/agent-commission.ts`
3. Modificar `actions/user.ts` (getAgents, updateAgentSettings)
4. Modificar `actions/quote.ts` (agentId)
5. Modificar `actions/policy.ts` (agentId)
6. Modificar `actions/commission.ts` (auto-generar AgentCommission)

### Fase 3: UI - Asignación de Vendedor
1. Crear `components/commissions/agent-selector.tsx`
2. Modificar `components/quotes/create-quote-dialog.tsx`
3. Modificar `components/policies/create-policy-dialog.tsx`

### Fase 4: UI - Comisiones de Vendedor
1. Crear `components/commissions/agent-commission-list.tsx`
2. Crear `components/commissions/register-agent-payment-dialog.tsx`
3. Crear `app/dashboard/commissions/agents/page.tsx`
4. Crear `app/dashboard/commissions/agents/[id]/page.tsx`

### Fase 5: Integración
1. Modificar `components/commissions/commission-list.tsx` (mostrar vinculadas)
2. Modificar `app/dashboard/commissions/page.tsx` (navegación)
3. Agregar widget en dashboard principal

---

## UI: Estructura de Navegación

```
/dashboard/commissions          → Lista comisiones CORREDORA
/dashboard/commissions/[id]     → Detalle comisión corredora
/dashboard/commissions/agents   → Lista comisiones VENDEDOR
/dashboard/commissions/agents/[id] → Detalle comisión vendedor
```

---

## Notas Importantes

1. **Multi-tenancy**: Todos los nuevos modelos incluyen `tenantId`
2. **Cascada**: Al eliminar Commission, se eliminan AgentCommission asociadas
3. **Moneda**: Por defecto UF, heredada de la comisión de corredora
4. **Status**: Usa el mismo enum CommissionStatus existente
5. **Cálculo**: `agentAmount = brokerageAmount * (agentPercentage / 100)`
