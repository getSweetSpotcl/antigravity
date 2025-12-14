---
name: zod-schemas
description: Patrón para crear schemas de validación con Zod. Usar al definir validaciones para formularios y server actions.
---

# Skill: Zod Schemas

Este skill define el patrón estándar para crear schemas de validación Zod en GiCS.

## Estructura de un Schema

```typescript
// schemas/entity.ts
import { z } from "zod"

export const EntitySchema = z.object({
    // Campos requeridos
    name: z.string().min(1, "El nombre es requerido"),

    // Campos opcionales
    description: z.string().optional(),

    // Campos con valor por defecto
    status: z.string().default("ACTIVE"),
})

// Tipo inferido para TypeScript
export type EntityFormValues = z.infer<typeof EntitySchema>
```

## Validaciones Comunes

### Strings

```typescript
// Requerido
name: z.string().min(1, "El nombre es requerido")

// Con longitud mínima/máxima
code: z.string().min(3, "Mínimo 3 caracteres").max(10, "Máximo 10 caracteres")

// Email
email: z.string().email("Email inválido")

// Opcional
notes: z.string().optional()

// Opcional con valor por defecto
currency: z.string().default("UF")
```

### Números (como strings para formularios)

```typescript
// Monto requerido
amount: z.string().min(1, "El monto es requerido")

// Monto con validación numérica
premium: z.string().min(1, "La prima es requerida").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
}, "Debe ser un número positivo")

// Porcentaje (0-100)
percentage: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0 && num <= 100
}, "Debe ser entre 0 y 100")

// Opcional
commission: z.string().optional()
```

### Fechas

```typescript
// Fecha requerida
startDate: z.date({
    message: "La fecha de inicio es requerida",
})

// Fecha opcional
validFrom: z.date().optional()

// Con mensaje personalizado
validUntil: z.date({
    required_error: "La fecha de validez es requerida",
    invalid_type_error: "Fecha inválida",
})
```

### Enums

```typescript
// Enum de tipos
type: z.enum(["GENERAL", "LIFE", "HEALTH", "AUTO", "HOME", "GUARANTEE"])

// Enum de estados
status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"])

// Enum opcional (permitir vacío)
beneficiaryType: z.enum(["ASEGURADO", "BANCO", "TERCERO"]).or(z.literal("")).optional()

// Enum con valor por defecto
currency: z.enum(["UF", "CLP", "USD"]).default("UF")
```

### Booleanos

```typescript
// Boolean simple
isActive: z.boolean()

// Boolean con default
sameAsContractor: z.boolean().default(false)

// Boolean requerido true
acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos"
})
```

### Objetos Anidados

```typescript
// Objeto anidado requerido
address: z.object({
    street: z.string().min(1, "La calle es requerida"),
    city: z.string().min(1, "La ciudad es requerida"),
    commune: z.string().min(1, "La comuna es requerida"),
})

// Objeto anidado opcional
propertyDetails: z.object({
    propertyType: z.string(),
    constructionType: z.string(),
}).optional()

// Cualquier objeto (para JSON flexible)
metadata: z.any().optional()
```

### Arrays

```typescript
// Array requerido con mínimo
coverages: z.array(CoverageItemSchema).min(1, "Debes agregar al menos una cobertura")

// Array opcional
items: z.array(ItemSchema).optional()

// Array de strings
tags: z.array(z.string()).optional()
```

## Validaciones Específicas del Dominio

### RUT Chileno

```typescript
const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$/

export const RutSchema = z.string().regex(
    rutRegex,
    "Formato de RUT inválido (ej: 12.345.678-9)"
)

// Uso en schema
contractorRut: RutSchema
```

### Cobertura de Seguro

```typescript
export const CoverageItemSchema = z.object({
    code: z.string().min(1, "El código de cobertura es requerido"),
    name: z.string().min(1, "El nombre de la cobertura es requerido"),
    insuredAmount: z.string().optional(),
    premium: z.string().min(1, "La prima es requerida").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
    }, "La prima debe ser un número positivo o cero"),
    deductible: z.string().optional(),
    required: z.boolean().default(false),
})
```

### Detalles de Propiedad (Incendio)

```typescript
export const PropertyDetailsSchema = z.object({
    propertyType: z.enum([
        "CASA", "DEPARTAMENTO", "OFICINA",
        "LOCAL_COMERCIAL", "BODEGA", "INDUSTRIA"
    ]),
    constructionType: z.enum([
        "HORMIGON_ARMADO", "ALBANILERIA",
        "MADERA", "METALICA", "MIXTA"
    ]),
    address: z.string().min(1, "La dirección es requerida"),
    commune: z.string().min(1, "La comuna es requerida"),
    city: z.string().min(1, "La ciudad es requerida"),
    buildingValue: z.string().min(1, "El valor es requerido"),
    contentsValue: z.string().optional(),
    yearBuilt: z.string().optional(),
    totalArea: z.string().optional(),
})
```

### Detalles de Vehículo

```typescript
export const VehicleDetailsSchema = z.object({
    plate: z.string().min(1, "La patente es requerida"),
    brand: z.string().min(1, "La marca es requerida"),
    model: z.string().min(1, "El modelo es requerido"),
    year: z.string().min(4, "El año es requerido"),
    vehicleValue: z.string().optional(),
    usage: z.enum(["PARTICULAR", "COMERCIAL", "TAXI", "COLECTIVO"]),
    chassis: z.string().optional(),
    engine: z.string().optional(),
})
```

## Refinements (Validaciones Cruzadas)

### Validación condicional

```typescript
export const QuoteSchema = z.object({
    sameAsContractor: z.boolean().default(false),
    insuredName: z.string().optional(),
    insuredRut: z.string().optional(),
}).refine((data) => {
    // Si no es el mismo que el tomador, requiere datos del asegurado
    if (!data.sameAsContractor) {
        return data.insuredName && data.insuredRut
    }
    return true
}, {
    message: "Debes completar los datos del asegurado",
    path: ["insuredName"], // Campo donde mostrar el error
})
```

### Validación OR (uno u otro)

```typescript
.refine((data) => data.clientId || data.prospectName, {
    message: "Debes seleccionar un cliente o ingresar el nombre de un prospecto",
    path: ["clientId"],
})
```

### Validación de fechas

```typescript
.refine((data) => {
    if (data.startDate && data.endDate) {
        return data.endDate > data.startDate
    }
    return true
}, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
})
```

## Schemas Parciales (para Updates)

```typescript
// Schema completo para creación
export const EntitySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
})

// Schema parcial para actualización
export const EntityUpdateSchema = EntitySchema.partial()

// O campos específicos
export const EntityStatusSchema = EntitySchema.pick({ status: true })
```

## Exportar Tipos

```typescript
// Siempre exportar el tipo inferido
export type EntityFormValues = z.infer<typeof EntitySchema>
export type CoverageItem = z.infer<typeof CoverageItemSchema>
export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>

// Para schemas con refinements, usar input/output
export type QuoteFormInput = z.input<typeof QuoteSchema>
export type QuoteFormOutput = z.output<typeof QuoteSchema>
```

## Archivos de Referencia

- `schemas/quote.ts` - Schema complejo con múltiples sub-schemas
- `schemas/policy.ts` - Schema con enums
- `schemas/claim.ts` - Schema con validaciones de montos
- `schemas/commission.ts` - Schema financiero
