"use server"

import * as z from "zod"
import { prisma } from "@/lib/db"
import { PolicySchema, UpdatePolicySchema, PolicyItemSchema } from "@/schemas/policy"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"
import { PolicyStatus } from "@prisma/client"

// Obtener todas las pólizas con filtros opcionales
export const getPolicies = async (filters?: {
    status?: PolicyStatus
    type?: string
    clientId?: string
    companyId?: string
}) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const where: any = { tenantId }

    if (filters?.status) where.status = filters.status
    if (filters?.type) where.type = filters.type
    if (filters?.clientId) where.clientId = filters.clientId
    if (filters?.companyId) where.companyId = filters.companyId

    const policies = await prisma.policy.findMany({
        where,
        include: {
            Client: true,
            InsuranceCompany: true,
            Agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return policies
}

// Obtener una póliza por ID
export const getPolicyById = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const policy = await prisma.policy.findUnique({
        where: { id },
        include: {
            Client: true,
            InsuranceCompany: true,
            Agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    defaultCommissionPercentage: true,
                },
            },
            Endorsement: {
                orderBy: { date: "desc" },
            },
            Claim: {
                orderBy: { createdAt: "desc" },
            },
            PolicyAttachment: {
                orderBy: { createdAt: "desc" },
            },
            PolicyItem: {
                orderBy: { itemNumber: "asc" },
            },
        },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return null
    }

    return policy
}

// Crear una nueva póliza
export const createPolicy = async (values: z.infer<typeof PolicySchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = PolicySchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const {
        number,
        company,
        companyId,
        agentId,
        type,
        startDate,
        endDate,
        premium,
        commission,
        currency,
        clientId,
        insuredProperty,
        coverages,
        deductibles,
    } = validatedFields.data

    try {
        const policy = await prisma.policy.create({
            data: {
                number,
                company,
                companyId: companyId || null,
                agentId: agentId || null,
                type,
                startDate,
                endDate,
                premium,
                commission,
                currency,
                clientId,
                tenantId,
                insuredProperty: insuredProperty || null,
                coverages: coverages || null,
                deductibles: deductibles || null,
            },
        })

        revalidatePath("/dashboard/policies")
        return { success: "Póliza creada exitosamente", policyId: policy.id }
    } catch {
        return { error: "Error al crear la póliza" }
    }
}

// Actualizar una póliza
export const updatePolicy = async (id: string, values: z.infer<typeof UpdatePolicySchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    // Verificar que la póliza pertenece al tenant
    const existingPolicy = await prisma.policy.findUnique({
        where: { id },
    })

    if (!existingPolicy || existingPolicy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    const validatedFields = UpdatePolicySchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    try {
        await prisma.policy.update({
            where: { id },
            data: validatedFields.data,
        })

        revalidatePath("/dashboard/policies")
        revalidatePath(`/dashboard/policies/${id}`)
        return { success: "Póliza actualizada exitosamente" }
    } catch {
        return { error: "Error al actualizar la póliza" }
    }
}

// Cambiar estado de una póliza
export const updatePolicyStatus = async (id: string, status: PolicyStatus) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const existingPolicy = await prisma.policy.findUnique({
        where: { id },
    })

    if (!existingPolicy || existingPolicy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    try {
        await prisma.policy.update({
            where: { id },
            data: { status },
        })

        revalidatePath("/dashboard/policies")
        revalidatePath(`/dashboard/policies/${id}`)
        return { success: `Estado cambiado a ${status}` }
    } catch {
        return { error: "Error al cambiar el estado" }
    }
}

// Eliminar una póliza (soft delete - cambiar a CANCELLED)
export const deletePolicy = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const existingPolicy = await prisma.policy.findUnique({
        where: { id },
        include: { Claim: true },
    })

    if (!existingPolicy || existingPolicy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    // No permitir eliminar si tiene siniestros activos
    const activeClaims = existingPolicy.Claim.filter(c => c.status !== "CLOSED")
    if (activeClaims.length > 0) {
        return { error: "No se puede eliminar una póliza con siniestros activos" }
    }

    try {
        await prisma.policy.update({
            where: { id },
            data: { status: "CANCELLED" },
        })

        revalidatePath("/dashboard/policies")
        return { success: "Póliza cancelada exitosamente" }
    } catch {
        return { error: "Error al cancelar la póliza" }
    }
}

// Agregar ítem a una póliza
export const addPolicyItem = async (policyId: string, values: z.infer<typeof PolicyItemSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { PolicyItem: true },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    const validatedFields = PolicyItemSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { description, value, currency, details } = validatedFields.data

    // Calcular el siguiente número de ítem
    const nextItemNumber = policy.PolicyItem.length + 1

    try {
        await prisma.policyItem.create({
            data: {
                policyId,
                itemNumber: nextItemNumber,
                description,
                value,
                currency: currency || "UF",
                details: details || null,
            },
        })

        revalidatePath(`/dashboard/policies/${policyId}`)
        return { success: "Ítem agregado exitosamente" }
    } catch {
        return { error: "Error al agregar el ítem" }
    }
}

// Eliminar ítem de una póliza
export const removePolicyItem = async (itemId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const item = await prisma.policyItem.findUnique({
        where: { id: itemId },
        include: { Policy: true },
    })

    if (!item || item.Policy.tenantId !== tenantId) {
        return { error: "Ítem no encontrado" }
    }

    try {
        await prisma.policyItem.delete({
            where: { id: itemId },
        })

        revalidatePath(`/dashboard/policies/${item.policyId}`)
        return { success: "Ítem eliminado exitosamente" }
    } catch {
        return { error: "Error al eliminar el ítem" }
    }
}

// Obtener pólizas para selector (dropdown)
export const getPoliciesForSelect = async (clientId?: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const where: any = {
        tenantId,
        status: "ACTIVE",
    }

    if (clientId) where.clientId = clientId

    const policies = await prisma.policy.findMany({
        where,
        select: {
            id: true,
            number: true,
            type: true,
            Client: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { number: "asc" },
    })

    return policies
}
