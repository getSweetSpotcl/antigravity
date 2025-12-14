---
name: insurance-domain
description: Conocimiento del dominio de seguros en Chile para GiCS. Usar cuando se trabaje con lógica de negocio de seguros, validaciones chilenas, o terminología del rubro.
---

# Skill: Dominio de Seguros Chilenos

Este skill contiene el conocimiento del dominio de seguros en Chile necesario para desarrollar features en GiCS.

## Modelos de Datos del Dominio

### Entidades Principales

```
Quote (Cotización) → Policy (Póliza) → Claim (Siniestro)
                  ↘ Rejected
```

### Tipos de Póliza (PolicyType)

| Enum | Español | Descripción |
|------|---------|-------------|
| `GENERAL` | Seguros Generales | Incendio, RC, Transporte, etc. |
| `LIFE` | Seguros de Vida | Individual, APV, Desgravamen |
| `HEALTH` | Seguros de Salud | Complementario, Catastrófico |
| `AUTO` | Seguros de Automóviles | SOAP, Todo Riesgo |
| `HOME` | Seguros de Hogar | Contenido, Estructura |
| `GUARANTEE` | Seguros de Garantía | Fiel Cumplimiento, Seriedad Oferta |

### Estados por Entidad

**QuoteStatus (Cotización)**
- `DRAFT` → Borrador (editable)
- `SENT` → Enviada al cliente
- `ACCEPTED` → Aceptada → Puede convertirse en Póliza
- `REJECTED` → Rechazada

**PolicyStatus (Póliza)**
- `ACTIVE` → Vigente
- `EXPIRED` → Vencida (automático por fecha)
- `CANCELLED` → Anulada (por endoso)
- `RENEWED` → Renovada (nueva póliza creada)

**ClaimStatus (Siniestro)**
- `REPORTED` → Reportado
- `IN_PROCESS` → En Proceso (pulse animation en UI)
- `APPROVED` → Aprobado
- `REJECTED` → Rechazado
- `CLOSED` → Cerrado

**CommissionStatus (Comisión)**
- `PENDING` → Pendiente de cobro
- `PARTIAL` → Parcialmente cobrada
- `PAID` → Pagada completamente
- `OVERDUE` → Vencida
- `CANCELLED` → Cancelada

**EndorsementType (Endoso)**
- `GENERAL_MODIFICATION` → Modificación general
- `RENEWAL` → Renovación
- `CANCELLATION` → Anulación
- `INCLUSION` → Inclusión de cobertura/item
- `EXCLUSION` → Exclusión de cobertura/item

## Monedas Soportadas

| Código | Descripción | Uso Principal |
|--------|-------------|---------------|
| `UF` | Unidad de Fomento | Primas, montos asegurados (default) |
| `CLP` | Peso Chileno | Comisiones, pagos |
| `USD` | Dólar Americano | Seguros internacionales |

La UF es una unidad reajustable según inflación, publicada diariamente por el Banco Central de Chile.

## Validación de RUT Chileno

El RUT (Rol Único Tributario) tiene formato: `XX.XXX.XXX-V` donde V es el dígito verificador (0-9 o K).

**Archivo de utilidades**: `lib/rut-utils.ts`

```typescript
import { validateRut, formatRut, cleanRut } from "@/lib/rut-utils"

// Validar
validateRut("12.345.678-5") // true/false

// Formatear (agregar puntos y guión)
formatRut("123456785") // "12.345.678-5"

// Limpiar (quitar formato)
cleanRut("12.345.678-5") // "123456785"
```

## Rubros de Seguros (Insurance Lines)

**Archivo**: `lib/insurance-constants.ts`

```typescript
import { INSURANCE_LINES, COMMON_COVERAGES } from "@/lib/insurance-constants"
```

### Seguros Generales
- `INCENDIO` - Incendio y adicionales
- `ROBO_CRISTALES` - Robo y cristales
- `RESPONSABILIDAD_CIVIL` - RC Empresa, Patronal, Productos
- `TRANSPORTE` - Carga nacional/internacional
- `TODO_RIESGO_CONSTRUCCION` - Proyectos de construcción

### Seguros de Vehículos
- `AUTO_OBLIGATORIO` - SOAP (obligatorio)
- `AUTO_TOTAL` - Todo riesgo automotriz

### Seguros de Vida
- `VIDA_INDIVIDUAL` - Vida temporal/permanente
- `VIDA_CON_AHORRO` - APV (Ahorro Previsional Voluntario)
- `VIDA_DESGRAVAMEN` - Hipotecario

### Garantías
- `GARANTIA` - Fiel cumplimiento, seriedad oferta

## Cálculos Financieros

### Prima y Comisión

```typescript
// Cálculo de comisión desde prima
const premium = 100 // UF
const commissionPercentage = 15 // 15%
const commission = premium * (commissionPercentage / 100) // 15 UF

// Con IVA (19% en Chile)
const IVA = 0.19
const commissionWithIVA = commission * (1 + IVA) // 17.85 UF
```

### Cuotas de Comisión

```typescript
// División en cuotas
const totalCommission = 120 // UF
const installments = 12 // mensual
const installmentAmount = totalCommission / installments // 10 UF/mes
```

## Flujos de Negocio

### 1. Cotización a Póliza

```
1. Crear Quote (DRAFT)
2. Completar información
3. Enviar a cliente (SENT)
4. Cliente acepta (ACCEPTED)
5. Crear Policy desde Quote
6. Generar Commission entries
```

### 2. Renovación de Póliza

```
1. Detectar pólizas próximas a vencer (30 días)
2. Enviar alerta al corredor
3. Crear nueva cotización de renovación
4. Cliente acepta
5. Crear nueva póliza
6. Marcar póliza anterior como RENEWED
```

### 3. Reporte de Siniestro

```
1. Crear Claim desde Policy (REPORTED)
2. Adjuntar documentos
3. Notificar a compañía (IN_PROCESS)
4. Seguimiento con ajustador
5. Resolución (APPROVED/REJECTED)
6. Cierre (CLOSED)
```

## Terminología Español/Inglés

| Español | Inglés (código) | Contexto |
|---------|-----------------|----------|
| Cotización | Quote | Propuesta de seguro |
| Póliza | Policy | Contrato vigente |
| Prima | Premium | Costo del seguro |
| Siniestro | Claim | Evento cubierto |
| Endoso | Endorsement | Modificación a póliza |
| Comisión | Commission | Pago al corredor |
| Asegurado | Insured | Persona/bien protegido |
| Beneficiario | Beneficiary | Quien recibe indemnización |
| Contratante | Contractor | Quien contrata el seguro |
| Deducible | Deductible | Monto a cargo del asegurado |
| Vigencia | Validity Period | Duración del contrato |
| Ramo | Insurance Line | Tipo/categoría de seguro |
| Corredor | Broker | Intermediario de seguros |

## Regulaciones CMF

La Comisión para el Mercado Financiero (CMF) regula los seguros en Chile.

- Los corredores deben estar inscritos en el registro CMF
- El campo `cmfRegistration` en Tenant guarda este número
- Ciertos seguros son obligatorios (SOAP, Desgravamen hipotecario)

## Ejemplos de Uso en Código

### Crear una cotización con validaciones chilenas

```typescript
// En actions/quote.ts
import { validateRut } from "@/lib/rut-utils"
import { POLICY_TYPES_ES } from "@/lib/insurance-constants"

// Validar RUT antes de guardar
if (!validateRut(contractorRut)) {
    return { error: "RUT del contratante inválido" }
}

// Usar tipo de póliza
const policyTypeLabel = POLICY_TYPES_ES[policyType] // "Seguros Generales"
```

### Mostrar estados con colores semánticos

```typescript
// Patrón estándar para status configs
const statusConfig: Record<ClaimStatus, { label: string; color: string; dot: string }> = {
    REPORTED: {
        label: "Reportado",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500"
    },
    IN_PROCESS: {
        label: "En Proceso",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500 status-pulse" // Animación para estados activos
    },
    // ...
}
```

### Formatear montos financieros

```typescript
// Usar tabular-nums para alineación
<span className="font-bold text-teal-700 tabular-nums">
    {Number(premium).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
</span>
<span className="text-xs font-medium text-muted-foreground ml-1">
    {currency}
</span>
```
