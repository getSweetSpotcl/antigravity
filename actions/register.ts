"use server"

import * as z from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { RegisterSchema } from "@/schemas"
// @ts-ignore
import { UserRole } from "@prisma/client"

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { brokerageName, brokerageRut, name, email, password } = validatedFields.data

    const hashedPassword = await bcrypt.hash(password, 10)

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        return { error: "El correo ya está en uso" }
    }

    const existingTenant = await prisma.tenant.findUnique({
        where: { rut: brokerageRut },
    })

    if (existingTenant) {
        return { error: "Una corredora con este RUT ya existe" }
    }

    // Create Tenant and User in a transaction
    try {
        await prisma.$transaction(async (tx: any) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: brokerageName,
                    rut: brokerageRut,
                    slug: brokerageName.toLowerCase().replace(/\s+/g, "-"), // Simple slug generation
                },
            })

            await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: UserRole.BROKERAGE_ADMIN,
                    tenantId: tenant.id,
                },
            })
        })

        return { success: "Corredora registrada exitosamente!" }
    } catch (error) {
        console.error("Registration error:", error)
        return { error: "Algo salió mal al registrar la corredora" }
    }
}
