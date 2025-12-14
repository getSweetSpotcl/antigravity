"use server"

import * as z from "zod"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { InviteUserSchema } from "@/schemas"
import { updateAgentSettingsSchema, type UpdateAgentSettingsInput } from "@/schemas/agent-commission"

export const getUsers = async () => {
    const session = await auth()

    if (!session?.user?.tenantId) {
        return []
    }

    const users = await prisma.user.findMany({
        where: {
            tenantId: session.user.tenantId,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return users
}

export const inviteUser = async (values: z.infer<typeof InviteUserSchema>) => {
    const session = await auth()

    if (!session?.user?.tenantId || session.user.role !== "BROKERAGE_ADMIN") {
        return { error: "No autorizado" }
    }

    const validatedFields = InviteUserSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { name, email, password } = validatedFields.data

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        return { error: "El correo ya está en uso" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "AGENT",
                tenantId: session.user.tenantId,
            },
        })

        return { success: "Agente creado exitosamente" }
    } catch {
        return { error: "Error al crear el usuario" }
    }
}

// Obtener agentes/vendedores del tenant (para selector)
export const getAgents = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const agents = await prisma.user.findMany({
        where: {
            tenantId,
            role: { in: ["AGENT", "BROKERAGE_ADMIN"] },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            defaultCommissionPercentage: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    return agents
}

// Obtener agente por ID con detalles
export const getAgentById = async (id: string) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const agent = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            defaultCommissionPercentage: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountType: true,
            createdAt: true,
        },
    })

    if (!agent) {
        return null
    }

    return agent
}

// Actualizar configuración del agente (comisión por defecto, datos bancarios)
export const updateAgentSettings = async (id: string, values: UpdateAgentSettingsInput) => {
    const tenantId = await getTenantContext()
    const session = await auth()

    if (!tenantId) {
        return { error: "No autorizado" }
    }

    // Solo BROKERAGE_ADMIN puede modificar o el mismo usuario
    if (session?.user?.role !== "BROKERAGE_ADMIN" && session?.user?.id !== id) {
        return { error: "No autorizado" }
    }

    const agent = await prisma.user.findUnique({
        where: { id },
    })

    if (!agent || agent.tenantId !== tenantId) {
        return { error: "Vendedor no encontrado" }
    }

    const validatedFields = updateAgentSettingsSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                defaultCommissionPercentage: validatedFields.data.defaultCommissionPercentage,
                bankName: validatedFields.data.bankName,
                bankAccountNumber: validatedFields.data.bankAccountNumber,
                bankAccountType: validatedFields.data.bankAccountType,
            },
        })

        revalidatePath("/dashboard/settings")
        return { success: "Configuración actualizada exitosamente" }
    } catch {
        return { error: "Error al actualizar configuración" }
    }
}
