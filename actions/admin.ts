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
            assignedPlan: true,
            _count: {
                select: { users: true, policies: true }
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
            users: true,
            assignedPlan: true,
            _count: {
                select: { policies: true, clients: true }
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

        if (data.planId) {
            updateData.planId = data.planId
            // Actualizar también el campo legacy 'plan' con el nombre del plan si está disponible
            if (data.planName) {
                updateData.plan = data.planName
            }
        } else if (data.plan) {
            updateData.plan = data.plan
        }

        await prisma.tenant.update({
            where: { id },
            data: updateData
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
