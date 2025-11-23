"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export const updateMyOrganization = async (data: {
    name: string
    rut: string
    billingEmail: string
    billingAddress: string
}) => {
    const session = await auth()

    // Solo BROKERAGE_ADMIN o SUPER_ADMIN pueden editar
    if (session?.user?.role !== "BROKERAGE_ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
        throw new Error("No autorizado")
    }

    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No se pudo obtener el contexto del tenant")
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: data.name,
                rut: data.rut,
                billingEmail: data.billingEmail,
                billingAddress: data.billingAddress
            }
        })

        revalidatePath("/dashboard/settings")
        return { success: "Organización actualizada exitosamente" }
    } catch (error) {
        console.error("Error updating organization:", error)
        return { error: "Error al actualizar la organización" }
    }
}

export const getMyOrganization = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No se pudo obtener el contexto del tenant")
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            id: true,
            name: true,
            rut: true,
            slug: true,
            billingEmail: true,
            billingAddress: true,
            logoUrl: true,
            createdAt: true
        }
    })

    if (!tenant) {
        throw new Error("Organización no encontrada")
    }

    return tenant
}
