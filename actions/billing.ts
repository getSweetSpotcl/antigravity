"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export const getMyBillingInfo = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        throw new Error("No se pudo obtener el contexto del tenant")
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            assignedPlan: true,
            billingRecords: {
                orderBy: { issueDate: "desc" },
                take: 10
            }
        }
    })

    if (!tenant) {
        throw new Error("Tenant no encontrado")
    }

    // Calcular monto mensual
    let monthlyAmount = tenant.customPrice ?? tenant.assignedPlan?.price ?? 0

    if (tenant.discountType === "PERCENTAGE" && tenant.discountValue) {
        monthlyAmount = monthlyAmount - (monthlyAmount * (tenant.discountValue / 100))
    } else if (tenant.discountType === "FIXED" && tenant.discountValue) {
        monthlyAmount = monthlyAmount - tenant.discountValue
    }

    monthlyAmount = Math.max(0, Math.round(monthlyAmount))

    return {
        tenant,
        monthlyAmount,
        planName: tenant.assignedPlan?.name || "Plan Personalizado",
        billingRecords: tenant.billingRecords
    }
}
