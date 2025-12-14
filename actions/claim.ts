"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { ClaimSchema, UpdateClaimSchema, UpdateClaimStatusSchema } from "@/schemas/claim"
import { getTenantContext } from "@/lib/tenant-context"
import { auth } from "@/lib/auth"
import type { ClaimStatus } from "@prisma/client"

const STATUS_LABELS: Record<ClaimStatus, string> = {
    REPORTED: "Reportado",
    IN_PROCESS: "En Proceso",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    CLOSED: "Cerrado",
}

// Obtener todos los siniestros con filtros opcionales
export const getClaims = async (filters?: {
    status?: ClaimStatus
    policyId?: string
    clientId?: string
    dateFrom?: Date
    dateTo?: Date
}) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const where: any = { tenantId }

    if (filters?.status) where.status = filters.status
    if (filters?.policyId) where.policyId = filters.policyId
    if (filters?.clientId) {
        where.policy = { clientId: filters.clientId }
    }
    if (filters?.dateFrom || filters?.dateTo) {
        where.date = {}
        if (filters.dateFrom) where.date.gte = filters.dateFrom
        if (filters.dateTo) where.date.lte = filters.dateTo
    }

    const claims = await prisma.claim.findMany({
        where,
        include: {
            Policy: {
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return claims
}

// Obtener un siniestro por ID
export const getClaimById = async (claimId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No autorizado")
    }

    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
        include: {
            Policy: {
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
            },
            ClaimAttachment: {
                orderBy: { createdAt: "desc" },
            },
            ClaimHistory: {
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!claim || claim.tenantId !== tenantId) {
        throw new Error("Siniestro no encontrado")
    }

    return claim
}

// Crear siniestro
export const createClaim = async (values: z.infer<typeof ClaimSchema>) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = ClaimSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const {
        policyId,
        number,
        date,
        description,
        status,
        claimAmount,
        reserveAmount,
        currency,
        adjusterName,
        adjusterPhone,
        adjusterEmail,
        adjusterCompany,
        reportedToCompanyDate,
        internalNotes,
    } = validatedFields.data

    // Verificar que la póliza pertenece al tenant
    const policy = await prisma.policy.findUnique({
        where: { id: policyId },
    })

    if (!policy || policy.tenantId !== tenantId) {
        return { error: "Póliza no encontrada" }
    }

    try {
        const claim = await prisma.claim.create({
            data: {
                policyId,
                number: number || null,
                date,
                description,
                status: status || "REPORTED",
                tenantId,
                claimAmount: claimAmount ? parseFloat(claimAmount) : null,
                reserveAmount: reserveAmount ? parseFloat(reserveAmount) : null,
                currency: currency || "UF",
                adjusterName: adjusterName || null,
                adjusterPhone: adjusterPhone || null,
                adjusterEmail: adjusterEmail || null,
                adjusterCompany: adjusterCompany || null,
                reportedToCompanyDate: reportedToCompanyDate || null,
                internalNotes: internalNotes || null,
                ClaimHistory: {
                    create: {
                        action: "CREATED",
                        description: "Siniestro creado",
                        userId: session?.user?.id,
                        userName: session?.user?.name || "Sistema",
                    },
                },
            },
        })

        revalidatePath("/dashboard/claims")
        return { success: "Siniestro creado exitosamente", claimId: claim.id }
    } catch {
        return { error: "Error al crear el siniestro" }
    }
}

// Actualizar siniestro
export const updateClaim = async (id: string, values: z.infer<typeof UpdateClaimSchema>) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const existingClaim = await prisma.claim.findUnique({
        where: { id },
    })

    if (!existingClaim || existingClaim.tenantId !== tenantId) {
        return { error: "Siniestro no encontrado" }
    }

    const validatedFields = UpdateClaimSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    try {
        await prisma.claim.update({
            where: { id },
            data: validatedFields.data,
        })

        // Registrar cambios en historial
        await prisma.claimHistory.create({
            data: {
                claimId: id,
                action: "UPDATED",
                description: "Información del siniestro actualizada",
                userId: session?.user?.id,
                userName: session?.user?.name || "Sistema",
            },
        })

        revalidatePath(`/dashboard/claims/${id}`)
        revalidatePath("/dashboard/claims")
        return { success: "Siniestro actualizado exitosamente" }
    } catch {
        return { error: "Error al actualizar el siniestro" }
    }
}

// Actualizar estado del siniestro
export const updateClaimStatus = async (values: z.infer<typeof UpdateClaimStatusSchema>) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const validatedFields = UpdateClaimStatusSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { claimId, status, notes } = validatedFields.data

    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
    })

    if (!claim || claim.tenantId !== tenantId) {
        return { error: "Siniestro no encontrado" }
    }

    const oldStatus = claim.status

    try {
        // Preparar datos de actualización
        const updateData: any = { status }

        // Si se cierra o resuelve, marcar fecha de resolución
        if (status === "CLOSED" || status === "APPROVED" || status === "REJECTED") {
            if (!claim.resolutionDate) {
                updateData.resolutionDate = new Date()
            }
        }

        await prisma.claim.update({
            where: { id: claimId },
            data: updateData,
        })

        // Registrar en historial
        await prisma.claimHistory.create({
            data: {
                claimId,
                action: "STATUS_CHANGE",
                description: `Estado cambiado de ${STATUS_LABELS[oldStatus]} a ${STATUS_LABELS[status]}${notes ? `: ${notes}` : ""}`,
                oldValue: oldStatus,
                newValue: status,
                userId: session?.user?.id,
                userName: session?.user?.name || "Sistema",
            },
        })

        revalidatePath(`/dashboard/claims/${claimId}`)
        revalidatePath("/dashboard/claims")
        return { success: "Estado actualizado exitosamente" }
    } catch {
        return { error: "Error al actualizar el estado" }
    }
}

// Agregar nota al historial
export const addClaimNote = async (claimId: string, note: string) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
    })

    if (!claim || claim.tenantId !== tenantId) {
        return { error: "Siniestro no encontrado" }
    }

    try {
        await prisma.claimHistory.create({
            data: {
                claimId,
                action: "NOTE_ADDED",
                description: note,
                userId: session?.user?.id,
                userName: session?.user?.name || "Sistema",
            },
        })

        revalidatePath(`/dashboard/claims/${claimId}`)
        return { success: "Nota agregada exitosamente" }
    } catch {
        return { error: "Error al agregar la nota" }
    }
}

// Actualizar montos del siniestro
export const updateClaimAmounts = async (
    claimId: string,
    amounts: {
        claimAmount?: number
        reserveAmount?: number
        approvedAmount?: number
        paidAmount?: number
    }
) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
    })

    if (!claim || claim.tenantId !== tenantId) {
        return { error: "Siniestro no encontrado" }
    }

    try {
        await prisma.claim.update({
            where: { id: claimId },
            data: amounts,
        })

        // Registrar en historial
        const changedFields = Object.entries(amounts)
            .filter(([_, value]) => value !== undefined)
            .map(([key, _]) => {
                const labels: Record<string, string> = {
                    claimAmount: "Monto reclamado",
                    reserveAmount: "Reserva técnica",
                    approvedAmount: "Monto aprobado",
                    paidAmount: "Monto pagado",
                }
                return labels[key]
            })
            .join(", ")

        await prisma.claimHistory.create({
            data: {
                claimId,
                action: "AMOUNT_UPDATE",
                description: `Montos actualizados: ${changedFields}`,
                userId: session?.user?.id,
                userName: session?.user?.name || "Sistema",
            },
        })

        revalidatePath(`/dashboard/claims/${claimId}`)
        return { success: "Montos actualizados exitosamente" }
    } catch {
        return { error: "Error al actualizar los montos" }
    }
}

// Obtener estadísticas de siniestros
export const getClaimStats = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const [total, byStatus, totalReserve, totalPaid] = await Promise.all([
        prisma.claim.count({
            where: { tenantId },
        }),
        prisma.claim.groupBy({
            by: ["status"],
            where: { tenantId },
            _count: true,
        }),
        prisma.claim.aggregate({
            where: { tenantId },
            _sum: { reserveAmount: true },
        }),
        prisma.claim.aggregate({
            where: { tenantId },
            _sum: { paidAmount: true },
        }),
    ])

    const statusCounts = byStatus.reduce(
        (acc, item) => {
            acc[item.status] = item._count
            return acc
        },
        {} as Record<string, number>
    )

    return {
        total,
        byStatus: statusCounts,
        totalReserve: Number(totalReserve._sum.reserveAmount) || 0,
        totalPaid: Number(totalPaid._sum.paidAmount) || 0,
    }
}

// Obtener pólizas para selector de siniestros
export const getPoliciesForClaim = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const policies = await prisma.policy.findMany({
        where: {
            tenantId,
            status: "ACTIVE",
        },
        include: {
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

// Obtener historial del siniestro
export const getClaimHistory = async (claimId: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
    })

    if (!claim || claim.tenantId !== tenantId) {
        return []
    }

    const history = await prisma.claimHistory.findMany({
        where: { claimId },
        orderBy: { createdAt: "desc" },
    })

    return history
}
