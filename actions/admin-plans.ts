"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Verificar si es super admin
const checkSuperAdmin = async () => {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        throw new Error("No autorizado: Se requieren permisos de Super Admin")
    }
    return session
}

export const getPlans = async () => {
    await checkSuperAdmin()

    const plans = await prisma.plan.findMany({
        orderBy: { price: "asc" },
        include: {
            _count: {
                select: { Tenant: true }
            }
        }
    })

    return plans
}

export const createPlan = async (data: {
    name: string
    description?: string
    price: number
    maxUsers: number
    maxStorage: number // en GB, convertir a bytes
}) => {
    await checkSuperAdmin()

    try {
        await prisma.plan.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                maxUsers: data.maxUsers,
                maxStorage: BigInt(data.maxStorage * 1024 * 1024 * 1024), // Convertir GB a Bytes
            }
        })

        revalidatePath("/admin/plans")
        return { success: "Plan creado exitosamente" }
    } catch (error) {
        console.error("Error creating plan:", error)
        return { error: "Error al crear el plan" }
    }
}

export const updatePlan = async (id: string, data: {
    name: string
    description?: string
    price: number
    maxUsers: number
    maxStorage: number // en GB
    isActive: boolean
}) => {
    await checkSuperAdmin()

    try {
        await prisma.plan.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                maxUsers: data.maxUsers,
                maxStorage: BigInt(data.maxStorage * 1024 * 1024 * 1024),
                isActive: data.isActive
            }
        })

        revalidatePath("/admin/plans")
        return { success: "Plan actualizado exitosamente" }
    } catch (error) {
        console.error("Error updating plan:", error)
        return { error: "Error al actualizar el plan" }
    }
}

export const deletePlan = async (id: string) => {
    await checkSuperAdmin()

    try {
        // Verificar si tiene tenants asignados
        const plan = await prisma.plan.findUnique({
            where: { id },
            include: { _count: { select: { Tenant: true } } }
        })

        if (plan && plan._count.Tenant > 0) {
            return { error: "No se puede eliminar un plan con organizaciones asignadas" }
        }

        await prisma.plan.delete({ where: { id } })

        revalidatePath("/admin/plans")
        return { success: "Plan eliminado exitosamente" }
    } catch (error) {
        console.error("Error deleting plan:", error)
        return { error: "Error al eliminar el plan" }
    }
}
