"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookies, headers } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"
import {
    checkRateLimit,
    getClientIPFromHeaders,
    rateLimitPresets,
} from "@/lib/rate-limit"
import {
    sendEmail,
    generateVerificationEmail,
    generatePasswordResetEmail,
    generateWelcomeEmail,
} from "@/lib/email"

const JWT_SECRET = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "portal-secret-key"
)

// Schemas de validación
const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Contraseña requerida"),
})

const RegisterSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    rut: z.string().min(1, "RUT requerido"),
    tenantSlug: z.string().min(1, "Código de corredora requerido"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

const ResetPasswordRequestSchema = z.object({
    email: z.string().email("Email inválido"),
})

const ResetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

// Tipos exportados
export type LoginFormValues = z.infer<typeof LoginSchema>
export type RegisterFormValues = z.infer<typeof RegisterSchema>

// Crear token JWT para el portal - Multi-corredor: usa RUT como identificador principal
async function createPortalToken(clientUserId: string, rut: string, email: string) {
    const token = await new SignJWT({
        clientUserId,
        rut,
        email,
        type: "portal",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET)

    return token
}

// Verificar token del portal
export async function verifyPortalToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as {
            clientUserId: string
            rut: string
            email: string
            type: string
        }
    } catch {
        return null
    }
}

// Obtener sesión del portal - Multi-corredor: busca todos los clientes con el mismo RUT
export async function getPortalSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get("portal-token")?.value

    if (!token) return null

    const payload = await verifyPortalToken(token)
    if (!payload || payload.type !== "portal") return null

    const clientUser = await prisma.clientUser.findUnique({
        where: { id: payload.clientUserId },
        include: {
            Client: {
                include: {
                    Tenant: {
                        select: {
                            id: true,
                            name: true,
                            logoUrl: true,
                            slug: true,
                        },
                    },
                },
            },
        },
    })

    if (!clientUser || !clientUser.isActive) return null

    // Obtener el RUT del cliente (usar el del token o el del Client relacionado)
    const rut = clientUser.rut || clientUser.Client.rut

    // Buscar TODOS los clientes con el mismo RUT en diferentes corredores
    const allClients = await prisma.client.findMany({
        where: { rut },
        include: {
            Tenant: {
                select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    slug: true,
                },
            },
        },
    })

    // Obtener el primer cliente para el nombre
    const primaryClient = clientUser.Client

    return {
        user: {
            id: clientUser.id,
            email: clientUser.email,
            name: `${primaryClient.firstName} ${primaryClient.lastName}`,
            rut: rut,
        },
        // Todos los corredores donde tiene pólizas
        tenants: allClients.map(c => ({
            id: c.Tenant.id,
            name: c.Tenant.name,
            logoUrl: c.Tenant.logoUrl,
            slug: c.Tenant.slug,
            clientId: c.id,
        })),
        // Tenant principal (donde se registró)
        primaryTenant: clientUser.Client.Tenant,
    }
}

// Helper para obtener todos los clientIds de un usuario por RUT
export async function getClientIdsByRut(rut: string): Promise<string[]> {
    const clients = await prisma.client.findMany({
        where: { rut },
        select: { id: true },
    })
    return clients.map(c => c.id)
}

// Login de cliente - Multi-corredor: usa RUT como identificador
export async function portalLogin(values: z.infer<typeof LoginSchema>) {
    // Rate limiting: 5 intentos por minuto
    const headersList = await headers()
    const clientIP = getClientIPFromHeaders(headersList)
    const rateLimit = checkRateLimit(clientIP, {
        ...rateLimitPresets.login,
        identifier: "portal-login",
    })

    if (!rateLimit.success) {
        const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        return {
            error: `Demasiados intentos. Por favor espera ${retryAfter} segundos.`,
        }
    }

    const validatedFields = LoginSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    const { email, password } = validatedFields.data

    const clientUser = await prisma.clientUser.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            Client: {
                include: {
                    Tenant: true,
                },
            },
        },
    })

    if (!clientUser) {
        return { error: "Credenciales inválidas" }
    }

    if (!clientUser.isActive) {
        return { error: "Su cuenta está desactivada. Contacte a su corredor." }
    }

    if (!clientUser.emailVerified) {
        return { error: "Debe verificar su email antes de iniciar sesión" }
    }

    const passwordMatch = await bcrypt.compare(password, clientUser.password)

    if (!passwordMatch) {
        return { error: "Credenciales inválidas" }
    }

    // Obtener el RUT (desde ClientUser o desde Client)
    const rut = clientUser.rut || clientUser.Client.rut

    // Actualizar último login y asegurar que el RUT esté guardado
    await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: {
            lastLogin: new Date(),
            rut: rut, // Asegurar que el RUT esté guardado
        },
    })

    // Crear token con RUT (permite acceso multi-corredor)
    const token = await createPortalToken(
        clientUser.id,
        rut,
        clientUser.email
    )

    const cookieStore = await cookies()
    cookieStore.set("portal-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
    })

    return {
        success: "Sesión iniciada correctamente",
        tenantSlug: clientUser.Client.Tenant.slug,
    }
}

// Registro de cliente - Multi-corredor: guarda el RUT normalizado
export async function portalRegister(values: z.infer<typeof RegisterSchema>) {
    // Rate limiting: 3 intentos por hora
    const headersList = await headers()
    const clientIP = getClientIPFromHeaders(headersList)
    const rateLimit = checkRateLimit(clientIP, {
        ...rateLimitPresets.register,
        identifier: "portal-register",
    })

    if (!rateLimit.success) {
        const retryAfterMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
        return {
            error: `Demasiados intentos de registro. Por favor espera ${retryAfterMinutes} minutos.`,
        }
    }

    const validatedFields = RegisterSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { email, password, rut, tenantSlug } = validatedFields.data

    // Normalizar el RUT (sin puntos, con guión, mayúsculas)
    const normalizedRut = rut.toUpperCase().replace(/\./g, "")

    // Buscar tenant por slug
    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
    })

    if (!tenant) {
        return { error: "Código de corredora no válido" }
    }

    // Buscar cliente por RUT en ese tenant
    const client = await prisma.client.findFirst({
        where: {
            tenantId: tenant.id,
            rut: normalizedRut,
        },
    })

    if (!client) {
        return { error: "No se encontró un cliente con ese RUT en esta corredora" }
    }

    // Verificar si ya existe un usuario del portal con este RUT (multi-corredor)
    const existingUserByRut = await prisma.clientUser.findFirst({
        where: { rut: normalizedRut },
    })

    if (existingUserByRut) {
        return { error: "Ya existe una cuenta con este RUT. Use esa cuenta para acceder a todos sus corredores." }
    }

    // Verificar si el email ya está en uso
    const existingEmail = await prisma.clientUser.findUnique({
        where: { email: email.toLowerCase() },
    })

    if (existingEmail) {
        return { error: "Este email ya está registrado" }
    }

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generar token de verificación
    const verifyToken = randomBytes(32).toString("hex")
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    // Crear usuario del portal con RUT (permite acceso multi-corredor)
    await prisma.clientUser.create({
        data: {
            clientId: client.id,
            email: email.toLowerCase(),
            password: hashedPassword,
            rut: normalizedRut, // Guardar RUT para acceso multi-corredor
            verifyToken,
            verifyTokenExpires,
            // Para desarrollo, verificamos automáticamente
            emailVerified: process.env.NODE_ENV === "development" ? new Date() : null,
        },
    })

    // Enviar email de verificación
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const verifyUrl = `${baseUrl}/portal/verify?token=${verifyToken}`

    if (process.env.NODE_ENV !== "development") {
        await sendEmail({
            to: email.toLowerCase(),
            subject: `Verifica tu cuenta - ${tenant.name}`,
            html: generateVerificationEmail({
                clientName: `${client.firstName} ${client.lastName}`,
                brokerageName: tenant.name,
                verifyUrl,
                expiresIn: "24 horas",
            }),
        })
    }

    if (process.env.NODE_ENV === "development") {
        return { success: "Cuenta creada exitosamente. Puede iniciar sesión." }
    }

    return { success: "Cuenta creada. Revise su email para verificar su cuenta." }
}

// Verificar email
export async function verifyEmail(token: string) {
    const clientUser = await prisma.clientUser.findFirst({
        where: {
            verifyToken: token,
            verifyTokenExpires: { gt: new Date() },
        },
        include: {
            Client: {
                include: { Tenant: true },
            },
        },
    })

    if (!clientUser) {
        return { error: "Token inválido o expirado" }
    }

    await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: {
            emailVerified: new Date(),
            verifyToken: null,
            verifyTokenExpires: null,
        },
    })

    // Enviar email de bienvenida
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const portalUrl = `${baseUrl}/portal/login`

    await sendEmail({
        to: clientUser.email,
        subject: `¡Bienvenido/a al Portal! - ${clientUser.Client.Tenant.name}`,
        html: generateWelcomeEmail({
            clientName: `${clientUser.Client.firstName} ${clientUser.Client.lastName}`,
            brokerageName: clientUser.Client.Tenant.name,
            portalUrl,
        }),
    })

    return { success: "Email verificado correctamente. Ya puede iniciar sesión." }
}

// Solicitar reset de password
export async function requestPasswordReset(values: z.infer<typeof ResetPasswordRequestSchema>) {
    // Rate limiting: 3 intentos por 15 minutos
    const headersList = await headers()
    const clientIP = getClientIPFromHeaders(headersList)
    const rateLimit = checkRateLimit(clientIP, {
        ...rateLimitPresets.passwordReset,
        identifier: "password-reset",
    })

    if (!rateLimit.success) {
        const retryAfterMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000)
        return {
            error: `Demasiadas solicitudes. Por favor espera ${retryAfterMinutes} minutos.`,
        }
    }

    const validatedFields = ResetPasswordRequestSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Email inválido" }
    }

    const { email } = validatedFields.data

    const clientUser = await prisma.clientUser.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            Client: {
                include: { Tenant: true },
            },
        },
    })

    // No revelar si el email existe o no
    if (!clientUser) {
        return { success: "Si el email existe, recibirá instrucciones para restablecer su contraseña." }
    }

    const resetToken = randomBytes(32).toString("hex")
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: {
            resetToken,
            resetTokenExpires,
        },
    })

    // Enviar email con link de reset
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/portal/reset-password?token=${resetToken}`

    await sendEmail({
        to: email.toLowerCase(),
        subject: `Restablecer contraseña - ${clientUser.Client.Tenant.name}`,
        html: generatePasswordResetEmail({
            clientName: `${clientUser.Client.firstName} ${clientUser.Client.lastName}`,
            brokerageName: clientUser.Client.Tenant.name,
            resetUrl,
            expiresIn: "1 hora",
        }),
    })

    return { success: "Si el email existe, recibirá instrucciones para restablecer su contraseña." }
}

// Resetear password
export async function resetPassword(values: z.infer<typeof ResetPasswordSchema>) {
    const validatedFields = ResetPasswordSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { token, password } = validatedFields.data

    const clientUser = await prisma.clientUser.findFirst({
        where: {
            resetToken: token,
            resetTokenExpires: { gt: new Date() },
        },
    })

    if (!clientUser) {
        return { error: "Token inválido o expirado" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpires: null,
        },
    })

    return { success: "Contraseña actualizada correctamente" }
}

// Logout
export async function portalLogout() {
    const cookieStore = await cookies()
    cookieStore.delete("portal-token")
    return { success: true }
}

// Cambiar contraseña (usuario autenticado)
export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await getPortalSession()

    if (!session) {
        return { error: "No autorizado" }
    }

    if (newPassword.length < 8) {
        return { error: "La nueva contraseña debe tener al menos 8 caracteres" }
    }

    const clientUser = await prisma.clientUser.findUnique({
        where: { id: session.user.id },
    })

    if (!clientUser) {
        return { error: "Usuario no encontrado" }
    }

    const passwordMatch = await bcrypt.compare(currentPassword, clientUser.password)

    if (!passwordMatch) {
        return { error: "Contraseña actual incorrecta" }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.clientUser.update({
        where: { id: clientUser.id },
        data: { password: hashedPassword },
    })

    return { success: "Contraseña actualizada correctamente" }
}
