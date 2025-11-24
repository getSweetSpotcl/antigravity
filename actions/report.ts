"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { startOfYear, endOfYear, eachMonthOfInterval, format } from "date-fns"
import { es } from "date-fns/locale"

export interface MonthlyMetric {
    month: string
    premiums: number
    commissions: number
    policyCount: number
}

export interface SalesSummary {
    totalPremiums: number
    totalCommissions: number
    totalPolicies: number
    activeClients: number
    monthlyMetrics: MonthlyMetric[]
}

export const getSalesReport = async (year: number = new Date().getFullYear()): Promise<SalesSummary> => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        throw new Error("No autorizado")
    }

    const startDate = startOfYear(new Date(year, 0, 1))
    const endDate = endOfYear(new Date(year, 0, 1))

    // Obtener todas las pólizas del año
    const policies = await prisma.policy.findMany({
        where: {
            tenantId: session.user.tenantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                not: "CANCELLED" // Excluir canceladas para métricas de venta bruta? O incluirlas? Usualmente ventas netas.
            }
        },
    })

    // Obtener total de clientes activos
    const activeClients = await prisma.client.count({
        where: {
            tenantId: session.user.tenantId,
        },
    })

    // Calcular totales
    const totalPremiums = policies.reduce((sum: number, p: any) => sum + Number(p.premium), 0)
    const totalCommissions = policies.reduce((sum: number, p: any) => sum + Number(p.commission), 0)
    const totalPolicies = policies.length

    // Generar métricas mensuales
    const months = eachMonthOfInterval({ start: startDate, end: endDate })

    const monthlyMetrics: MonthlyMetric[] = months.map((monthDate) => {
        const monthPolicies = policies.filter((p: any) => {
            const pDate = new Date(p.createdAt)
            return pDate.getMonth() === monthDate.getMonth() && pDate.getFullYear() === monthDate.getFullYear()
        })

        return {
            month: format(monthDate, "MMM", { locale: es }),
            premiums: monthPolicies.reduce((sum: number, p: any) => sum + Number(p.premium), 0),
            commissions: monthPolicies.reduce((sum: number, p: any) => sum + Number(p.commission), 0),
            policyCount: monthPolicies.length,
        }
    })

    return {
        totalPremiums,
        totalCommissions,
        totalPolicies,
        activeClients,
        monthlyMetrics,
    }
}
