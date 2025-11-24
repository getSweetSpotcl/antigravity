"use server"

import * as z from "zod"
import { signIn } from "@/lib/auth"
import { LoginSchema } from "@/schemas"
import { AuthError } from "next-auth"

export const login = async (values: z.infer<typeof LoginSchema>) => {
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
        console.log("LOGIN ERROR:", error)

        // NextAuth throws NEXT_REDIRECT on successful login, so we need to check for it
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
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
