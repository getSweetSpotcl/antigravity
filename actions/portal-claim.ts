"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"

const PortalClaimSchema = z.object({
    policyId: z.string().min(1, "Seleccione una póliza"),
    date: z.date({ message: "Fecha del siniestro requerida" }),
    description: z.string().min(10, "Describa el siniestro (mínimo 10 caracteres)"),
    claimAmount: z.string().optional(),
})

export type PortalClaimFormValues = z.infer<typeof PortalClaimSchema>

export async function createPortalClaim(values: PortalClaimFormValues) {
    const session = await getPortalSession()

    if (!session) {
        return { error: "No autorizado" }
    }

    const validatedFields = PortalClaimSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { policyId, date, description, claimAmount } = validatedFields.data

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    // Verificar que la póliza pertenece al cliente (por RUT)
    const policy = await prisma.policy.findFirst({
        where: {
            id: policyId,
            clientId: { in: clientIds },
            status: "ACTIVE",
        },
    })

    if (!policy) {
        return { error: "Póliza no encontrada o no está activa" }
    }

    try {
        // Generar número de siniestro usando el tenant de la póliza
        const year = new Date().getFullYear()
        const count = await prisma.claim.count({
            where: {
                tenantId: policy.tenantId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                },
            },
        })

        const claimNumber = `SIN-${year}-${String(count + 1).padStart(4, "0")}`

        const claim = await prisma.claim.create({
            data: {
                number: claimNumber,
                policyId,
                tenantId: policy.tenantId, // Usar el tenant de la póliza
                date,
                description,
                claimAmount: claimAmount ? parseFloat(claimAmount) : null,
                currency: policy.currency,
                status: "REPORTED",
            },
        })

        // Crear registro en historial
        await prisma.claimHistory.create({
            data: {
                claimId: claim.id,
                action: "CREATED",
                description: "Siniestro reportado desde el portal de clientes",
                userName: session.user.name,
            },
        })

        revalidatePath("/portal/claims")

        return {
            success: "Siniestro reportado exitosamente",
            claimId: claim.id,
            claimNumber,
        }
    } catch {
        return { error: "Error al reportar el siniestro" }
    }
}

// Obtener siniestros del cliente (multi-corredor)
export async function getPortalClaims() {
    const session = await getPortalSession()

    if (!session) {
        return []
    }

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    const claims = await prisma.claim.findMany({
        where: {
            Policy: { clientId: { in: clientIds } },
        },
        include: {
            Policy: {
                select: {
                    number: true,
                    type: true,
                    InsuranceCompany: {
                        select: { name: true },
                    },
                    Client: {
                        include: {
                            Tenant: {
                                select: { name: true },
                            },
                        },
                    },
                },
            },
            ClaimHistory: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return claims
}

// Obtener detalle de un siniestro (multi-corredor)
export async function getPortalClaimById(claimId: string) {
    const session = await getPortalSession()

    if (!session) {
        return null
    }

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    const claim = await prisma.claim.findFirst({
        where: {
            id: claimId,
            Policy: { clientId: { in: clientIds } },
        },
        include: {
            Policy: {
                select: {
                    number: true,
                    type: true,
                    InsuranceCompany: {
                        select: { name: true },
                    },
                    Client: {
                        include: {
                            Tenant: {
                                select: { name: true },
                            },
                        },
                    },
                },
            },
            ClaimHistory: {
                orderBy: { createdAt: "desc" },
            },
            ClaimAttachment: true,
        },
    })

    return claim
}
