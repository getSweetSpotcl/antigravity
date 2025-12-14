---
name: server-actions
description: Patrón estándar para crear Server Actions en Next.js 15 con multi-tenancy. Usar al crear nuevas actions en el directorio actions/.
---

# Skill: Server Actions Pattern

Este skill define el patrón estándar para crear Server Actions en GiCS, asegurando consistencia, seguridad multi-tenant y manejo de errores.

## Estructura Base de una Server Action

```typescript
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { EntitySchema } from "@/schemas/entity"

export const createEntity = async (values: z.infer<typeof EntitySchema>) => {
    // 1. Verificar tenant (SIEMPRE PRIMERO)
    const tenantId = await getTenantContext()
    if (!tenantId) {
        return { error: "No autorizado" }
    }

    // 2. Validar datos con Zod
    const validatedFields = EntitySchema.safeParse(values)
    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    const { field1, field2 } = validatedFields.data

    try {
        // 3. Realizar operación con tenantId
        const result = await prisma.entity.create({
            data: {
                field1,
                field2,
                tenantId, // SIEMPRE incluir tenantId
            },
        })

        // 4. Revalidar cache
        revalidatePath("/dashboard/entities")

        return { success: "Entidad creada exitosamente", data: result }
    } catch (error) {
        console.error("Error creating entity:", error)
        return { error: "Error al crear la entidad" }
    }
}
```

## Operaciones CRUD Completas

### CREATE

```typescript
export const createEntity = async (values: z.infer<typeof EntitySchema>) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    const validated = EntitySchema.safeParse(values)
    if (!validated.success) return { error: "Datos inválidos" }

    try {
        const result = await prisma.entity.create({
            data: {
                ...validated.data,
                tenantId,
            },
        })

        revalidatePath("/dashboard/entities")
        return { success: "Creado exitosamente", data: result }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error al crear" }
    }
}
```

### READ (Lista)

```typescript
export const getEntities = async () => {
    const tenantId = await getTenantContext()
    if (!tenantId) throw new Error("No autorizado")

    const entities = await prisma.entity.findMany({
        where: { tenantId }, // FILTRAR POR TENANT
        include: {
            relation: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return entities
}
```

### READ (Por ID)

```typescript
export const getEntityById = async (id: string) => {
    const tenantId = await getTenantContext()
    if (!tenantId) throw new Error("No autorizado")

    const entity = await prisma.entity.findUnique({
        where: { id },
        include: { relations: true },
    })

    // VERIFICAR PERTENENCIA AL TENANT
    if (!entity || entity.tenantId !== tenantId) {
        throw new Error("No encontrado")
    }

    return entity
}
```

### UPDATE

```typescript
export const updateEntity = async (id: string, values: z.infer<typeof EntitySchema>) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    const validated = EntitySchema.safeParse(values)
    if (!validated.success) return { error: "Datos inválidos" }

    try {
        // VERIFICAR PERTENENCIA ANTES DE ACTUALIZAR
        const existing = await prisma.entity.findUnique({ where: { id } })
        if (!existing || existing.tenantId !== tenantId) {
            return { error: "No encontrado" }
        }

        const result = await prisma.entity.update({
            where: { id },
            data: validated.data,
        })

        revalidatePath("/dashboard/entities")
        revalidatePath(`/dashboard/entities/${id}`)
        return { success: "Actualizado exitosamente" }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error al actualizar" }
    }
}
```

### DELETE

```typescript
export const deleteEntity = async (id: string) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        // VERIFICAR PERTENENCIA ANTES DE ELIMINAR
        const existing = await prisma.entity.findUnique({ where: { id } })
        if (!existing || existing.tenantId !== tenantId) {
            return { error: "No encontrado" }
        }

        await prisma.entity.delete({ where: { id } })

        revalidatePath("/dashboard/entities")
        return { success: "Eliminado exitosamente" }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error al eliminar" }
    }
}
```

## Actualización de Estado

```typescript
export const updateEntityStatus = async (
    id: string,
    status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const entity = await prisma.entity.findUnique({ where: { id } })
        if (!entity || entity.tenantId !== tenantId) {
            return { error: "No encontrado" }
        }

        await prisma.entity.update({
            where: { id },
            data: { status },
        })

        revalidatePath("/dashboard/entities")
        return { success: "Estado actualizado" }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error al actualizar estado" }
    }
}
```

## Con Auditoría

```typescript
import { logCreate, logUpdate, logDelete } from "@/lib/audit"

export const createEntity = async (values: z.infer<typeof EntitySchema>) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    const validated = EntitySchema.safeParse(values)
    if (!validated.success) return { error: "Datos inválidos" }

    try {
        const result = await prisma.entity.create({
            data: { ...validated.data, tenantId },
        })

        // Registrar en auditoría
        await logCreate("entity", result.id, result.name, result)

        revalidatePath("/dashboard/entities")
        return { success: "Creado exitosamente", data: result }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error al crear" }
    }
}
```

## Transacciones

```typescript
export const complexOperation = async (values: ComplexSchema) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Operación 1
            const entity = await tx.entity.create({
                data: { ...values.entity, tenantId },
            })

            // Operación 2
            await tx.relatedEntity.createMany({
                data: values.items.map(item => ({
                    ...item,
                    entityId: entity.id,
                })),
            })

            return entity
        })

        revalidatePath("/dashboard/entities")
        return { success: "Operación completada", data: result }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error en la operación" }
    }
}
```

## Manejo de Archivos Adjuntos

```typescript
export const addAttachment = async (
    entityId: string,
    fileData: {
        url: string
        name: string
        size: number
        type: string
    }
) => {
    const tenantId = await getTenantContext()
    if (!tenantId) return { error: "No autorizado" }

    try {
        const entity = await prisma.entity.findUnique({ where: { id: entityId } })
        if (!entity || entity.tenantId !== tenantId) {
            return { error: "No encontrado" }
        }

        await prisma.entityAttachment.create({
            data: {
                entityId,
                fileUrl: fileData.url,
                fileName: fileData.name,
                fileSize: fileData.size,
                fileType: fileData.type,
            },
        })

        revalidatePath(`/dashboard/entities/${entityId}`)
        return { success: "Archivo adjuntado" }
    } catch (error) {
        console.error("Error:", error)
        return { error: "Error al adjuntar archivo" }
    }
}
```

## Archivos de Referencia

- `actions/quote.ts` - Ejemplo completo con todas las operaciones
- `actions/policy.ts` - Ejemplo con relaciones complejas
- `actions/claim.ts` - Ejemplo con historial de cambios
- `actions/commission.ts` - Ejemplo con cálculos financieros

## Convenciones de Mensajes

```typescript
// Mensajes de éxito en español
return { success: "Cotización creada exitosamente" }
return { success: "Estado actualizado" }
return { success: "Archivo adjuntado correctamente" }

// Mensajes de error en español
return { error: "No autorizado" }
return { error: "Datos inválidos" }
return { error: "No encontrado" }
return { error: "Error al crear la cotización" }
```

## Rutas de Revalidación

```typescript
// Lista principal
revalidatePath("/dashboard/entities")

// Detalle específico
revalidatePath(`/dashboard/entities/${id}`)

// Rutas relacionadas
revalidatePath("/dashboard/related")

// Dashboard (para widgets)
revalidatePath("/dashboard")
```
