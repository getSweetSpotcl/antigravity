---
name: quote-workflow
description: Flujo completo de cotizaciones de seguros. Usar cuando se trabaje con features de cotización, conversión a póliza, o comunicaciones con clientes.
---

# Skill: Quote Workflow

Este skill documenta el flujo completo de cotizaciones en GiCS, desde la creación hasta la conversión en póliza.

## Modelo de Datos

```prisma
model Quote {
    id                   String               @id @default(cuid())
    quoteNumber          String?              // COT-YYYYMMDD-XXXX
    prospectName         String?              // Cliente potencial
    clientId             String?              // Cliente existente

    // Tomador (Contratante)
    contractorName       String
    contractorRut        String
    contractorEmail      String?
    contractorPhone      String?

    // Asegurado
    insuredName          String?
    insuredRut           String?
    insuredAddress       String?

    // Beneficiario
    beneficiaryName      String?
    beneficiaryRut       String?
    beneficiaryType      String?              // ASEGURADO, BANCO, TERCERO

    // Póliza
    companyId            String?              // Compañía aseguradora
    policyType           PolicyType           // GENERAL, LIFE, AUTO, etc.
    insuredProperty      Json?                // Detalles del bien asegurado
    coverages            Json                 // Array de coberturas

    // Montos
    totalInsuredAmount   Decimal?
    totalPremium         Decimal
    currency             String               @default("UF")
    commissionPercentage Decimal?

    // Vigencia
    validFrom            DateTime?
    validUntil           DateTime
    policyDuration       Int?                 // meses

    // Estado
    status               QuoteStatus          @default(DRAFT)

    // Notas
    notes                String?              // Visibles al cliente
    internalNotes        String?              // Solo internas

    // Relaciones
    attachments          QuoteAttachment[]
    communications       QuoteCommunication[]
    policy               Policy?              // Póliza creada desde esta cotización
}
```

## Estados y Transiciones

```
DRAFT → SENT → ACCEPTED → Policy Created
            ↘ REJECTED
```

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `DRAFT` | Borrador editable | Editar, Enviar, Eliminar |
| `SENT` | Enviada al cliente | Aceptar, Rechazar |
| `ACCEPTED` | Aceptada, lista para póliza | Crear Póliza |
| `REJECTED` | Rechazada por cliente | Reabrir (volver a DRAFT) |

## Formulario Multi-Paso

El formulario de cotización tiene 5 pasos:

### Paso 1: Información del Cliente (`step1-client-info.tsx`)
- Selección de cliente existente o prospecto nuevo
- Datos del tomador (contratante): nombre, RUT, email, teléfono
- Checkbox "Asegurado es el mismo que el tomador"
- Datos del asegurado si es diferente
- Datos del beneficiario (opcional)

### Paso 2: Información del Seguro (`step2-insurance-info.tsx`)
- Selección de compañía aseguradora
- Tipo de póliza (ramo)
- Rubro específico (línea de seguro)
- Detalles del bien asegurado según tipo:
  - Propiedad (incendio): tipo, construcción, dirección, valor
  - Vehículo (auto): patente, marca, modelo, año
  - Vida: edad, ocupación, monto cobertura
  - Garantía: tipo contrato, monto, descripción proyecto
  - RC: tipo actividad, límite, empleados
  - Transporte: tipo carga, ruta, modo
  - Ingeniería: tipo obra, valor, periodo

### Paso 3: Deducibles y Condiciones (`step3-deductibles.tsx`)
- Configuración de deducibles por cobertura
- Condiciones particulares
- Número POL (condiciones generales)

### Paso 4: Coberturas (`step4-coverages.tsx`)
- Lista de coberturas disponibles según rubro
- Monto asegurado por cobertura
- Prima por cobertura
- Deducible por cobertura
- Cálculo automático de prima total

### Paso 5: Revisión (`step5-review.tsx`)
- Resumen completo de la cotización
- Fechas de vigencia
- Notas internas y para cliente
- Botón de guardar

## Server Actions

### Crear Cotización

```typescript
// actions/quote.ts
export const createQuote = async (values: z.infer<typeof QuoteSchema>) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    const validated = QuoteSchema.safeParse(values)
    if (!validated.success) return { error: "Datos inválidos" }

    // Manejar compañía personalizada
    let finalCompanyId = values.companyId
    if (values.companyId === "OTHER" && values.customCompanyName) {
        // Buscar o crear compañía
    }

    // Generar número de cotización
    const quoteNumber = `COT-${date}-${random}`

    await prisma.quote.create({
        data: {
            quoteNumber,
            ...validated.data,
            tenantId,
        },
    })

    revalidatePath("/dashboard/quotes")
    return { success: "Cotización creada", quoteNumber }
}
```

### Actualizar Estado

```typescript
export const updateQuoteStatus = async (
    id: string,
    status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
) => {
    // Verificar tenant y pertenencia
    // Actualizar estado
    revalidatePath("/dashboard/quotes")
    return { success: "Estado actualizado" }
}
```

### Crear Póliza desde Cotización

```typescript
export const createPolicyFromQuote = async (quoteId: string) => {
    const tenantId = await getTenantContext()

    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { client: true, company: true, policy: true },
    })

    // Validaciones
    if (!quote.clientId) {
        return { error: "Debe tener cliente asociado" }
    }
    if (quote.policy) {
        return { error: "Ya existe póliza asociada" }
    }

    // Crear póliza
    const policy = await prisma.policy.create({
        data: {
            number: generatePolicyNumber(),
            company: quote.company?.name,
            companyId: quote.companyId,
            type: quote.policyType,
            status: "ACTIVE",
            startDate: quote.validFrom || new Date(),
            endDate: calculateEndDate(quote),
            premium: quote.totalPremium,
            commission: calculateCommission(quote),
            currency: quote.currency,
            clientId: quote.clientId,
            tenantId,
            quoteId: quote.id,
            coverages: quote.coverages,
            insuredProperty: quote.insuredProperty,
        },
    })

    // Actualizar cotización a ACCEPTED
    await prisma.quote.update({
        where: { id: quoteId },
        data: { status: "ACCEPTED" },
    })

    return { success: `Póliza ${policy.number} creada`, policyId: policy.id }
}
```

## Comunicaciones

Las cotizaciones registran interacciones con el cliente:

```typescript
export const addCommunication = async (values: CommunicationSchema) => {
    // Tipos: CALL, EMAIL, MEETING, WHATSAPP, NOTE, COMPANY_RESPONSE
    await prisma.quoteCommunication.create({
        data: {
            quoteId: values.quoteId,
            type: values.type,
            subject: values.subject,
            content: values.content,
            contactPerson: values.contactPerson,
        },
    })
}
```

## Archivos Adjuntos

```typescript
export const addQuoteAttachment = async (quoteId: string, fileData: FileData) => {
    await prisma.quoteAttachment.create({
        data: {
            quoteId,
            fileUrl: fileData.url,
            fileName: fileData.name,
            fileSize: fileData.size,
            fileType: fileData.type,
        },
    })
}
```

## Generación de PDF

```typescript
// components/quotes/pdf/quote-document.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

export const QuoteDocument = ({ quote, tenant }) => (
    <Document>
        <Page style={styles.page}>
            {/* Header con logo del tenant */}
            {/* Datos del cliente */}
            {/* Tabla de coberturas */}
            {/* Totales */}
            {/* Términos y condiciones */}
            {/* Firma */}
        </Page>
    </Document>
)
```

## Componentes Principales

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `CreateQuoteDialog` | `components/quotes/create-quote-dialog.tsx` | Formulario multi-paso |
| `QuoteList` | `components/quotes/quote-list.tsx` | Lista con acciones |
| `QuoteDetailView` | `components/quotes/quote-detail-view.tsx` | Vista detalle |
| `EditQuoteDialog` | `components/quotes/edit-quote-dialog.tsx` | Edición |
| `CommunicationsList` | `components/quotes/communications-list.tsx` | Historial |
| `QuoteAttachments` | `components/quotes/quote-attachments.tsx` | Archivos |
| `DownloadQuoteButton` | `components/quotes/pdf/download-button.tsx` | Descarga PDF |

## Archivos de Referencia

- `schemas/quote.ts` - Schema Zod completo
- `actions/quote.ts` - Todas las server actions
- `app/dashboard/quotes/page.tsx` - Página de listado
- `app/dashboard/quotes/[id]/page.tsx` - Página de detalle
- `lib/insurance-constants.ts` - Tipos de seguro y coberturas
