"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { addDays, addMonths, startOfMonth, endOfMonth, format } from "date-fns"
import { es } from "date-fns/locale"

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

/**
 * Calcula el monto a cobrar para un tenant basado en su plan y descuentos
 */
const calculateBillingAmount = (tenant: {
    Plan: { price: number } | null
    customPrice: number | null
    discountType: string | null
    discountValue: number | null
}): number => {
    // Usar precio personalizado si existe, sino el del plan
    let baseAmount = tenant.customPrice ?? tenant.Plan?.price ?? 0

    // Aplicar descuento si existe
    if (tenant.discountType && tenant.discountValue) {
        if (tenant.discountType === "PERCENTAGE") {
            baseAmount = baseAmount - (baseAmount * tenant.discountValue / 100)
        } else if (tenant.discountType === "FIXED") {
            baseAmount = Math.max(0, baseAmount - tenant.discountValue)
        }
    }

    return Math.round(baseAmount)
}

/**
 * Genera cobros para todos los tenants activos
 * Se ejecuta el día 25 de cada mes, con vencimiento el día 5 del mes siguiente
 */
export const generateMonthlyBilling = async (options?: {
    tenantId?: string  // Si se especifica, solo genera para ese tenant
    skipAuth?: boolean // Para llamadas desde cron
}) => {
    // Solo verificar auth si no viene de cron
    if (!options?.skipAuth) {
        await checkSuperAdmin()
    }

    const today = new Date()
    const nextMonth = addMonths(today, 1)
    const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5) // Día 5 del próximo mes

    // Período de facturación (mes actual)
    const billingPeriod = format(today, "MMMM yyyy", { locale: es })

    try {
        // Obtener tenants activos con suscripción
        const whereClause: any = {
            subscriptionStatus: { in: ["ACTIVE", "TRIAL"] },
            // Excluir tenants sin precio (plan FREE o sin configuración)
            OR: [
                { customPrice: { not: null } },
                { Plan: { price: { gt: 0 } } }
            ]
        }

        // Si se especifica un tenant, filtrar solo ese
        if (options?.tenantId) {
            whereClause.id = options.tenantId
        }

        const tenants = await prisma.tenant.findMany({
            where: whereClause,
            include: {
                Plan: true,
                BillingRecord: {
                    where: {
                        // Verificar si ya existe un cobro para este período
                        issueDate: {
                            gte: startOfMonth(today),
                            lte: endOfMonth(today)
                        }
                    }
                }
            }
        })

        const results = {
            generated: 0,
            skipped: 0,
            errors: 0,
            details: [] as { tenantId: string; tenantName: string; status: string; amount?: number }[]
        }

        for (const tenant of tenants) {
            // Saltar si ya tiene cobro este mes
            if (tenant.BillingRecord.length > 0) {
                results.skipped++
                results.details.push({
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    status: "skipped - ya tiene cobro este mes"
                })
                continue
            }

            const amount = calculateBillingAmount(tenant)

            // Saltar si el monto es 0
            if (amount <= 0) {
                results.skipped++
                results.details.push({
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    status: "skipped - monto es 0"
                })
                continue
            }

            try {
                await prisma.billingRecord.create({
                    data: {
                        tenantId: tenant.id,
                        amount,
                        currency: "CLP",
                        dueDate,
                        description: `Suscripción ${billingPeriod} - ${tenant.Plan?.name || "Plan Personalizado"}`,
                        status: "PENDING"
                    }
                })

                // Actualizar próxima fecha de facturación
                await prisma.tenant.update({
                    where: { id: tenant.id },
                    data: {
                        nextBillingDate: addMonths(today, 1)
                    }
                })

                results.generated++
                results.details.push({
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    status: "generated",
                    amount
                })
            } catch (error) {
                console.error(`Error generating billing for tenant ${tenant.id}:`, error)
                results.errors++
                results.details.push({
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    status: "error"
                })
            }
        }

        revalidatePath("/admin/tenants")

        return {
            success: `Cobros generados: ${results.generated}, Omitidos: ${results.skipped}, Errores: ${results.errors}`,
            results
        }
    } catch (error) {
        console.error("Error generating monthly billing:", error)
        return { error: "Error al generar los cobros mensuales" }
    }
}

/**
 * Genera cobro manual para un tenant específico
 */
export const generateBillingForTenant = async (tenantId: string) => {
    await checkSuperAdmin()

    const result = await generateMonthlyBilling({ tenantId })

    revalidatePath(`/admin/tenants/${tenantId}`)

    return result
}
