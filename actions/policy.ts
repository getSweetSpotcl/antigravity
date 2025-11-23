"use server"

import * as z from "zod"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { PolicySchema } from "@/schemas/policy"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"

export const getPolicies = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const policies = await prisma.policy.findMany({
        where: {
            tenantId: tenantId,
        },
        include: {
            client: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return policies
}

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
        type,
        startDate,
        endDate,
        premium,
        commission,
        currency,
        clientId
    } = validatedFields.data

    try {
        await prisma.policy.create({
            data: {
                number,
                company,
                type,
                startDate,
                endDate,
                premium,
                commission,
                currency,
                clientId,
                tenantId: tenantId,
            },
        })

        revalidatePath("/dashboard/policies")
        return { success: "Póliza creada exitosamente" }
    } catch (error) {
        console.error("Create policy error:", error)
        return { error: "Error al crear la póliza" }
    }
}
