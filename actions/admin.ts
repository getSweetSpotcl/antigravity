"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { ADMIN_TENANT_COOKIE } from "@/lib/tenant-context"

// Verificar si es super admin
const checkSuperAdmin = async () => {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        throw new Error("No autorizado: Se requieren permisos de Super Admin")
    }
    return session
}

export const getAllTenants = async () => {
    await checkSuperAdmin()

    const tenants = await prisma.tenant.findMany({
        include: {
            Plan: true,
            _count: {
                select: { User: true, Policy: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return tenants
}

export const getTenantById = async (id: string) => {
    await checkSuperAdmin()

    const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
            User: true,
            Plan: true,
            _count: {
                select: { Policy: true, Client: true }
            }
        }
    })

    return tenant
}

export const updateTenant = async (id: string, data: any) => {
    await checkSuperAdmin()

    try {
        const updateData: any = {
            name: data.name,
            subscriptionStatus: data.subscriptionStatus,
            maxUsers: parseInt(data.maxUsers),
            customPrice: data.customPrice !== undefined && data.customPrice !== "" ? parseInt(data.customPrice) : null,
            discountType: data.discountType || null,
            discountValue: data.discountValue !== undefined && data.discountValue !== "" ? parseInt(data.discountValue) : null,
            billingDay: data.billingDay ? parseInt(data.billingDay) : 1,
        }

        // Agregar campos opcionales si están presentes
        if (data.rut !== undefined) updateData.rut = data.rut
        if (data.billingEmail !== undefined) updateData.billingEmail = data.billingEmail
        if (data.billingAddress !== undefined) updateData.billingAddress = data.billingAddress

        // Calcular nextBillingDate si cambia el billingDay
        if (data.billingDay) {
            const today = new Date()
            const currentDay = today.getDate()
            const billingDay = parseInt(data.billingDay)

            let nextDate = new Date(today)
            // Manejar meses con menos días (ej: febrero)
            // Si billingDay es 31 y el mes no lo tiene, JS ajusta automáticamente al siguiente mes, 
            // pero para facturación recurrente es mejor usar librerías o lógica robusta.
            // Por simplicidad, usaremos setDate y dejaremos que JS ajuste, pero idealmente billingDay debería ser <= 28.
            nextDate.setDate(billingDay)

            // Si el día de facturación ya pasó este mes, programar para el próximo
            if (currentDay >= billingDay) {
                nextDate.setMonth(nextDate.getMonth() + 1)
            }

            updateData.nextBillingDate = nextDate
        }

        // Manejar planId - "custom" significa sin plan predefinido
        if (data.planId === "custom") {
            updateData.planId = null
            updateData.plan = "Custom"
        } else if (data.planId) {
            updateData.planId = data.planId
            // Actualizar también el campo legacy 'plan' con el nombre del plan si está disponible
            if (data.planName) {
                updateData.plan = data.planName
            }
        } else if (data.plan) {
            updateData.plan = data.plan
        }

        console.log("Updating tenant with data:", JSON.stringify(updateData, null, 2))

        const updated = await prisma.tenant.update({
            where: { id },
            data: updateData
        })

        console.log("Tenant updated successfully:", {
            planId: updated.planId,
            discountType: updated.discountType,
            discountValue: updated.discountValue,
            customPrice: updated.customPrice
        })

        revalidatePath("/admin/tenants")
        revalidatePath(`/admin/tenants/${id}`)
        return { success: "Tenant actualizado correctamente" }
    } catch (error) {
        console.error("Error updating tenant:", error)
        return { error: "Error al actualizar el tenant" }
    }
}

export const switchAdminContext = async (tenantId: string) => {
    await checkSuperAdmin()

    // Verificar que el tenant exista
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
    })

    if (!tenant) {
        return { error: "Tenant no encontrado" }
    }

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_TENANT_COOKIE, tenantId, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 // 24 horas
    })

    revalidatePath("/")
    return { success: `Contexto cambiado a ${tenant.name}` }
}

export const clearAdminContext = async () => {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_TENANT_COOKIE)
    revalidatePath("/")
    return { success: "Contexto restaurado a tenant principal" }
}

// ==================== Platform Users (Super Admins) ====================

export const getPlatformUsers = async () => {
    await checkSuperAdmin()

    const users = await prisma.user.findMany({
        where: {
            role: "SUPER_ADMIN"
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            Tenant: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return users
}

export const createPlatformUser = async (data: {
    name: string
    email: string
    password: string
    tenantId?: string
}) => {
    await checkSuperAdmin()

    try {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        })

        if (existingUser) {
            return { error: "Ya existe un usuario con este email" }
        }

        // Hash password
        const bcrypt = await import("bcryptjs")
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: "SUPER_ADMIN",
                tenantId: data.tenantId || null
            }
        })

        revalidatePath("/admin/users")
        return { success: "Usuario de plataforma creado", user }
    } catch (error) {
        console.error("Error creating platform user:", error)
        return { error: "Error al crear el usuario" }
    }
}

export const updatePlatformUser = async (id: string, data: {
    name?: string
    email?: string
    password?: string
    tenantId?: string | null
}) => {
    await checkSuperAdmin()

    try {
        const updateData: any = {}

        if (data.name) updateData.name = data.name
        if (data.email) {
            // Check if email is taken by another user
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id }
                }
            })
            if (existingUser) {
                return { error: "Ya existe un usuario con este email" }
            }
            updateData.email = data.email
        }
        if (data.password) {
            const bcrypt = await import("bcryptjs")
            updateData.password = await bcrypt.hash(data.password, 10)
        }
        if (data.tenantId !== undefined) {
            updateData.tenantId = data.tenantId || null
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        })

        revalidatePath("/admin/users")
        return { success: "Usuario actualizado" }
    } catch (error) {
        console.error("Error updating platform user:", error)
        return { error: "Error al actualizar el usuario" }
    }
}

export const deletePlatformUser = async (id: string) => {
    const session = await checkSuperAdmin()

    // Prevent self-deletion
    if (session.user.id === id) {
        return { error: "No puedes eliminar tu propia cuenta" }
    }

    try {
        await prisma.user.delete({
            where: { id }
        })

        revalidatePath("/admin/users")
        return { success: "Usuario eliminado" }
    } catch (error) {
        console.error("Error deleting platform user:", error)
        return { error: "Error al eliminar el usuario" }
    }
}
