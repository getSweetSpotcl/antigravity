import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Buscar tenants que necesitan facturación
    // nextBillingDate <= today
    const tenantsToBill = await prisma.tenant.findMany({
        where: {
            subscriptionStatus: "ACTIVE",
            nextBillingDate: {
                lte: today
            }
        },
        include: { assignedPlan: true }
    })

    const results = []

    for (const tenant of tenantsToBill) {
        // Calcular monto
        let amount = tenant.customPrice ?? tenant.assignedPlan?.price ?? 0

        if (tenant.discountType === "PERCENTAGE" && tenant.discountValue) {
            amount = amount - (amount * (tenant.discountValue / 100))
        } else if (tenant.discountType === "FIXED" && tenant.discountValue) {
            amount = amount - tenant.discountValue
        }

        amount = Math.max(0, Math.round(amount))

        // Crear registro de facturación
        await prisma.billingRecord.create({
            data: {
                tenantId: tenant.id,
                amount,
                status: "PENDING",
                dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 días para pagar
                description: `Suscripción Mensual - ${tenant.assignedPlan?.name || "Plan Personalizado"}`,
                issueDate: new Date()
            }
        })

        // Actualizar próxima fecha de facturación
        const nextDate = new Date(today)
        nextDate.setMonth(nextDate.getMonth() + 1)

        // Intentar mantener el día de facturación original
        const billingDay = tenant.billingDay || 1

        // Establecer al día deseado del siguiente mes
        nextDate.setDate(billingDay)

        // Verificación de desbordamiento de mes (ej: 31 Ene + 1 mes -> 31 Feb (no existe) -> 3 Mar)
        // Si el mes resultante no es el esperado (mes actual + 1), ajustar al último día del mes correcto
        const expectedMonth = (today.getMonth() + 1) % 12
        if (nextDate.getMonth() !== expectedMonth) {
            // Volver al último día del mes anterior (que es el mes correcto)
            nextDate.setDate(0)
        }

        await prisma.tenant.update({
            where: { id: tenant.id },
            data: { nextBillingDate: nextDate }
        })

        results.push({ tenant: tenant.name, amount, nextDate })
    }

    return NextResponse.json({ success: true, processed: results.length, details: results })
}
