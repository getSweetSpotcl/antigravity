"use server"

import * as z from "zod"
import { headers } from "next/headers"
import { signIn } from "@/lib/auth"
import { LoginSchema } from "@/schemas"
import { AuthError } from "next-auth"
import {
    checkRateLimit,
    getClientIPFromHeaders,
    rateLimitPresets,
} from "@/lib/rate-limit"

export const login = async (values: z.infer<typeof LoginSchema>) => {
    // Rate limiting: 5 intentos por minuto
    const headersList = await headers()
    const clientIP = getClientIPFromHeaders(headersList)
    const rateLimit = checkRateLimit(clientIP, {
        ...rateLimitPresets.login,
        identifier: "login",
    })

    if (!rateLimit.success) {
        const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        return {
            error: `Demasiados intentos de inicio de sesión. Por favor espera ${retryAfter} segundos.`,
        }
    }

    const validatedFields = LoginSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Campos inválidos" }
    }

    const { email, password } = validatedFields.data

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        })
    } catch (error) {
        // NextAuth throws NEXT_REDIRECT on successful login, so we need to check for it
        if (isRedirectError(error)) {
            // This is actually a successful redirect, let it through
            throw error
        }

        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Credenciales inválidas. Por favor verifica tu email y contraseña." }
                case "AccessDenied":
                    return { error: "Acceso denegado" }
                default:
                    return { error: "Error al iniciar sesión. Por favor intenta nuevamente." }
            }
        }

        // For any other error, return a generic message
        return { error: "Error al iniciar sesión. Por favor intenta nuevamente." }
    }
}

function isRedirectError(error: any) {
    return (
        error instanceof Error &&
        (error.message === "NEXT_REDIRECT" ||
            (error as any).digest?.startsWith("NEXT_REDIRECT"))
    )
}
