"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ClaimSchema, UpdateClaimStatusSchema } from "@/schemas/claim"

export const getClaims = async () => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        throw new Error("No autorizado")
    }

    const claims = await prisma.claim.findMany({
        where: {
            tenantId: session.user.tenantId,
        },
        include: {
            policy: {
                include: {
                    client: true,
                    insuranceCompany: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return claims
}

export const getClaimById = async (claimId: string) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        throw new Error("No autorizado")
    }

    const claim = await prisma.claim.findUnique({
        where: {
            id: claimId,
        },
        include: {
            policy: {
                include: {
                    client: true,
                    insuranceCompany: true,
                },
            },
        },
    })

    if (!claim || claim.tenantId !== session.user.tenantId) {
        throw new Error("Siniestro no encontrado")
    }

    return claim
}

export const createClaim = async (values: z.infer<typeof ClaimSchema>) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        return { success: false, error: "No autorizado" }
    }

    const validatedFields = ClaimSchema.safeParse(values)

    if (!validatedFields.success) {
        return { success: false, error: "Campos inválidos" }
    }

    const { policyId, description, date, number } = validatedFields.data

    try {
        // Verificar que la póliza pertenece al tenant
        const policy = await prisma.policy.findUnique({
            where: { id: policyId },
        })

        if (!policy || policy.tenantId !== session.user.tenantId) {
            return { success: false, error: "Póliza no encontrada" }
        }

        // Crear siniestro
        const claim = await prisma.claim.create({
            data: {
                policyId,
                description,
                date,
                number,
                tenantId: session.user.tenantId,
                status: "REPORTED",
            },
        })

        revalidatePath("/dashboard/claims")
        return { success: true, claimId: claim.id }
    } catch (error) {
        console.error("Error creating claim:", error)
        return { success: false, error: "Error al crear el siniestro" }
    }
}

export const updateClaimStatus = async (values: z.infer<typeof UpdateClaimStatusSchema>) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        return { success: false, error: "No autorizado" }
    }

    const validatedFields = UpdateClaimStatusSchema.safeParse(values)

    if (!validatedFields.success) {
        return { success: false, error: "Campos inválidos" }
    }

    const { claimId, status } = validatedFields.data

    try {
        // Verificar que el siniestro pertenece al tenant
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
        })

        if (!claim || claim.tenantId !== session.user.tenantId) {
            return { success: false, error: "Siniestro no encontrado" }
        }

        // Actualizar estado
        await prisma.claim.update({
            where: { id: claimId },
            data: { status },
        })

        revalidatePath(`/dashboard/claims/${claimId}`)
        revalidatePath("/dashboard/claims")
        return { success: true }
    } catch (error) {
        console.error("Error updating claim status:", error)
        return { success: false, error: "Error al actualizar el estado" }
    }
}

export const getPoliciesForClaim = async () => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        throw new Error("No autorizado")
    }

    const policies = await prisma.policy.findMany({
        where: {
            tenantId: session.user.tenantId,
            status: "ACTIVE",
        },
        include: {
            client: true,
        },
        orderBy: {
            number: "asc",
        },
    })

    return policies
}
