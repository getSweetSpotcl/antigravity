"use server"

import * as z from "zod"
import { headers } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { RegisterSchema } from "@/schemas"
import {
    checkRateLimit,
    getClientIPFromHeaders,
    rateLimitPresets,
} from "@/lib/rate-limit"

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    // Rate limiting: 3 intentos por hora
    const headersList = await headers()
    const clientIP = getClientIPFromHeaders(headersList)
    const rateLimit = checkRateLimit(clientIP, {
        ...rateLimitPresets.register,
        identifier: "register",
    })

    if (!rateLimit.success) {
        const retryAfterMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
        return {
            error: `Demasiados intentos de registro. Por favor espera ${retryAfterMinutes} minutos.`,
        }
    }

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
        await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: brokerageName,
                    rut: brokerageRut,
                    slug: brokerageName.toLowerCase().replace(/\s+/g, "-"),
                },
            })

            await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "BROKERAGE_ADMIN",
                    tenantId: tenant.id,
                },
            })
        })

        return { success: "Corredora registrada exitosamente!" }
    } catch {
        return { error: "Algo salió mal al registrar la corredora" }
    }
}
