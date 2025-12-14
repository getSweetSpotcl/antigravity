"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { addMonths, addDays, isBefore, isAfter } from "date-fns"

export const getPoliciesNearingExpiration = async (daysAhead: number = 30) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        throw new Error("No autorizado")
    }

    const today = new Date()
    const futureDate = addDays(today, daysAhead)

    const policies = await prisma.policy.findMany({
        where: {
            tenantId: session.user.tenantId,
            status: "ACTIVE",
            endDate: {
                gte: today,
                lte: futureDate,
            },
        },
        include: {
            Client: true,
            InsuranceCompany: true,
        },
        orderBy: {
            endDate: "asc",
        },
    })

    return policies as Array<typeof policies[number]>
}

export const renewPolicy = async (policyId: string, newEndDate: Date) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        return { success: false, error: "No autorizado" }
    }

    try {
        const policy = await prisma.policy.findUnique({
            where: { id: policyId },
        })

        if (!policy || policy.tenantId !== session.user.tenantId) {
            return { success: false, error: "Póliza no encontrada" }
        }

        // Crear endoso de renovación
        await prisma.endorsement.create({
            data: {
                policyId,
                type: "RENEWAL",
                description: `Renovación de póliza hasta ${newEndDate.toLocaleDateString()}`,
                date: new Date(),
                number: `REN-${Date.now()}`,
            },
        })

        // Actualizar póliza
        await prisma.policy.update({
            where: { id: policyId },
            data: {
                endDate: newEndDate,
                status: "RENEWED",
            },
        })

        return { success: true }
    } catch {
        return { success: false, error: "Error al renovar la póliza" }
    }
}

export const markPolicyAsExpired = async (policyId: string) => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        return { success: false, error: "No autorizado" }
    }

    try {
        const policy = await prisma.policy.findUnique({
            where: { id: policyId },
        })

        if (!policy || policy.tenantId !== session.user.tenantId) {
            return { success: false, error: "Póliza no encontrada" }
        }

        await prisma.policy.update({
            where: { id: policyId },
            data: { status: "EXPIRED" },
        })

        return { success: true }
    } catch {
        return { success: false, error: "Error al actualizar la póliza" }
    }
}
