"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { EndorsementSchema, UpdateEndorsementSchema } from "@/schemas/endorsement"
import { getTenantContext } from "@/lib/tenant-context"

// Obtener endosos de una póliza
export const getEndorsementsByPolicyId = async (policyId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    // Verificar que la póliza pertenece al tenant
    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return []
    }

    const endorsements = await prisma.endorsement.findMany({
        where: { policyId },
        orderBy: { date: "desc" },
    })

    return endorsements
}

// Obtener un endoso por ID
export const getEndorsementById = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const endorsement = await prisma.endorsement.findUnique({
        where: { id },
        include: {
            Policy: true,
        },
    })

    if (!endorsement || endorsement.Policy.tenantId !== tenantId) {
        return null
    }

    return endorsement
}

// Crear endoso
export const createEndorsement = async (values: z.infer<typeof EndorsementSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = EndorsementSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { policyId, type, description, date, number, premiumChange, effectiveDate, notes } = validatedFields.data

    // Verificar que la póliza pertenece al tenant
    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    try {
        // Crear endoso
        const endorsement = await prisma.endorsement.create({
            data: {
                policyId,
                type,
                description,
                date,
                number: number || null,
                premiumChange: premiumChange ? parseFloat(premiumChange) : null,
                effectiveDate: effectiveDate || null,
                notes: notes || null,
            },
        })

        // Actualizar estado de póliza si es necesario
        if (type === "CANCELLATION") {
            await prisma.policy.update({
                where: { id: policyId },
                data: { status: "CANCELLED" },
            })
        } else if (type === "RENEWAL") {
            await prisma.policy.update({
                where: { id: policyId },
                data: { status: "RENEWED" },
            })
        }

        // Si hay cambio de prima, actualizar la prima de la póliza
        if (premiumChange) {
            const newPremium = Number(policy.premium) + parseFloat(premiumChange)
            if (newPremium >= 0) {
                await prisma.policy.update({
                    where: { id: policyId },
                    data: { premium: newPremium },
                })
            }
        }

        revalidatePath(`/dashboard/policies/${policyId}`)
        return { success: "Endoso creado exitosamente", endorsementId: endorsement.id }
    } catch {
        return { error: "Error al crear el endoso" }
    }
}

// Actualizar endoso
export const updateEndorsement = async (id: string, values: z.infer<typeof UpdateEndorsementSchema>) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    // Verificar que el endoso existe y pertenece al tenant
    const existingEndorsement = await prisma.endorsement.findUnique({
        where: { id },
        include: { Policy: true },
    })

    if (!existingEndorsement || existingEndorsement.Policy.tenantId !== tenantId) {
        return { error: "Endoso no encontrado" }
    }

    const validatedFields = UpdateEndorsementSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    try {
        await prisma.endorsement.update({
            where: { id },
            data: validatedFields.data,
        })

        revalidatePath(`/dashboard/policies/${existingEndorsement.policyId}`)
        return { success: "Endoso actualizado exitosamente" }
    } catch {
        return { error: "Error al actualizar el endoso" }
    }
}

// Eliminar endoso
export const deleteEndorsement = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    // Verificar que el endoso existe y pertenece al tenant
    const existingEndorsement = await prisma.endorsement.findUnique({
        where: { id },
        include: { Policy: true },
    })

    if (!existingEndorsement || existingEndorsement.Policy.tenantId !== tenantId) {
        return { error: "Endoso no encontrado" }
    }

    // No permitir eliminar endosos de cancelación si la póliza está cancelada
    if (existingEndorsement.type === "CANCELLATION" && existingEndorsement.Policy.status === "CANCELLED") {
        return { error: "No se puede eliminar un endoso de cancelación de una póliza cancelada" }
    }

    try {
        // Si el endoso tenía un cambio de prima, revertirlo
        if (existingEndorsement.premiumChange) {
            const newPremium = Number(existingEndorsement.Policy.premium) - Number(existingEndorsement.premiumChange)
            if (newPremium >= 0) {
                await prisma.policy.update({
                    where: { id: existingEndorsement.policyId },
                    data: { premium: newPremium },
                })
            }
        }

        await prisma.endorsement.delete({
            where: { id },
        })

        revalidatePath(`/dashboard/policies/${existingEndorsement.policyId}`)
        return { success: "Endoso eliminado exitosamente" }
    } catch {
        return { error: "Error al eliminar el endoso" }
    }
}

// Obtener resumen de endosos por póliza
export const getEndorsementsSummary = async (policyId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return null
    }

    const endorsements = await prisma.endorsement.findMany({
        where: { policyId },
    })

    const summary = {
        total: endorsements.length,
        byType: {
            GENERAL_MODIFICATION: 0,
            RENEWAL: 0,
            CANCELLATION: 0,
            INCLUSION: 0,
            EXCLUSION: 0,
        },
        totalPremiumChange: 0,
    }

    endorsements.forEach((e) => {
        summary.byType[e.type as keyof typeof summary.byType]++
        if (e.premiumChange) {
            summary.totalPremiumChange += Number(e.premiumChange)
        }
    })

    return summary
}
