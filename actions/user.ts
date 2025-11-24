"use server"

import * as z from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
// @ts-ignore
import { UserRole } from "@prisma/client"

import { InviteUserSchema } from "@/schemas"

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

    if (!session?.user?.tenantId || session.user.role !== UserRole.BROKERAGE_ADMIN) {
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
                role: UserRole.AGENT,
                tenantId: session.user.tenantId,
            },
        })

        return { success: "Agente creado exitosamente" }
    } catch (error) {
        console.error("Create user error:", error)
        return { error: "Error al crear el usuario" }
    }
}
