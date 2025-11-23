"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const checkSuperAdmin = async () => {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
        throw new Error("No autorizado")
    }
    return session
}

export const getBillingRecords = async (tenantId: string) => {
    await checkSuperAdmin()

    const records = await prisma.billingRecord.findMany({
        where: { tenantId },
        orderBy: { issueDate: "desc" }
    })

    return records
}

export const createBillingRecord = async (data: {
    tenantId: string
    amount: number
    dueDate: Date
    description?: string
}) => {
    await checkSuperAdmin()

    try {
        await prisma.billingRecord.create({
            data: {
                tenantId: data.tenantId,
                amount: data.amount,
                dueDate: data.dueDate,
                description: data.description,
                status: "PENDING"
            }
        })

        revalidatePath(`/admin/tenants/${data.tenantId}`)
        return { success: "Cobro generado exitosamente" }
    } catch (error) {
        console.error("Error creating billing record:", error)
        return { error: "Error al generar el cobro" }
    }
}

export const markAsPaid = async (recordId: string, tenantId: string) => {
    await checkSuperAdmin()

    try {
        await prisma.billingRecord.update({
            where: { id: recordId },
            data: {
                status: "PAID",
                paidAt: new Date()
            }
        })

        revalidatePath(`/admin/tenants/${tenantId}`)
        return { success: "Marcado como pagado" }
    } catch (error) {
        console.error("Error marking as paid:", error)
        return { error: "Error al actualizar el estado" }
    }
}
