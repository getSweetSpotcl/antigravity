"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { logExport } from "@/lib/audit"

interface DateRangeParams {
    startDate: Date
    endDate: Date
}

// ============================================
// REPORTE DE CARTERA DE PÓLIZAS
// ============================================

export async function getPortfolioReport(params?: DateRangeParams) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const now = new Date()

    const policies = await prisma.policy.findMany({
        where: {
            tenantId,
            status: "ACTIVE",
        },
        include: {
            Client: {
                select: {
                    firstName: true,
                    lastName: true,
                    rut: true,
                },
            },
            InsuranceCompany: {
                select: { name: true },
            },
        },
        orderBy: { endDate: "asc" },
    })

    // Group by type
    const byType = policies.reduce((acc, policy) => {
        const type = policy.type
        if (!acc[type]) {
            acc[type] = { count: 0, premium: 0, policies: [] }
        }
        acc[type].count++
        acc[type].premium += Number(policy.premium)
        acc[type].policies.push(policy)
        return acc
    }, {} as Record<string, { count: number; premium: number; policies: typeof policies }>)

    // Group by company
    const byCompany = policies.reduce((acc, policy) => {
        const company = policy.InsuranceCompany?.name || policy.company
        if (!acc[company]) {
            acc[company] = { count: 0, premium: 0 }
        }
        acc[company].count++
        acc[company].premium += Number(policy.premium)
        return acc
    }, {} as Record<string, { count: number; premium: number }>)

    // Expiring soon (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = policies.filter(
        (p) => new Date(p.endDate) <= thirtyDaysFromNow
    )

    // Summary stats
    const totalPremium = policies.reduce((sum, p) => sum + Number(p.premium), 0)
    const totalCommission = policies.reduce((sum, p) => sum + Number(p.commission), 0)

    return {
        summary: {
            totalPolicies: policies.length,
            totalPremium,
            totalCommission,
            averagePremium: policies.length > 0 ? totalPremium / policies.length : 0,
            expiringSoonCount: expiringSoon.length,
        },
        byType: Object.entries(byType).map(([type, data]) => ({
            type,
            count: data.count,
            premium: data.premium,
            percentage: ((data.count / policies.length) * 100).toFixed(1),
        })),
        byCompany: Object.entries(byCompany)
            .map(([company, data]) => ({
                company,
                count: data.count,
                premium: data.premium,
            }))
            .sort((a, b) => b.count - a.count),
        expiringSoon: expiringSoon.map((p) => ({
            id: p.id,
            number: p.number,
            clientName: `${p.Client.firstName} ${p.Client.lastName}`,
            clientRut: p.Client.rut,
            company: p.InsuranceCompany?.name || p.company,
            type: p.type,
            premium: Number(p.premium),
            currency: p.currency,
            endDate: p.endDate,
            daysRemaining: Math.ceil(
                (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
        })),
        policies: policies.map((p) => ({
            id: p.id,
            number: p.number,
            clientName: `${p.Client.firstName} ${p.Client.lastName}`,
            clientRut: p.Client.rut,
            company: p.InsuranceCompany?.name || p.company,
            type: p.type,
            premium: Number(p.premium),
            commission: Number(p.commission),
            currency: p.currency,
            startDate: p.startDate,
            endDate: p.endDate,
            status: p.status,
        })),
        generatedAt: new Date(),
    }
}

// ============================================
// REPORTE DE PRODUCCIÓN POR PERÍODO
// ============================================

export async function getProductionReport(params: DateRangeParams) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const { startDate, endDate } = params

    // New policies created in period
    const newPolicies = await prisma.policy.findMany({
        where: {
            tenantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            Client: {
                select: { firstName: true, lastName: true },
            },
            InsuranceCompany: {
                select: { name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    // Quotes in period
    const quotes = await prisma.quote.findMany({
        where: {
            tenantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    })

    // Group by type
    const byType = newPolicies.reduce((acc, policy) => {
        const type = policy.type
        if (!acc[type]) {
            acc[type] = { count: 0, premium: 0, commission: 0 }
        }
        acc[type].count++
        acc[type].premium += Number(policy.premium)
        acc[type].commission += Number(policy.commission)
        return acc
    }, {} as Record<string, { count: number; premium: number; commission: number }>)

    // Group by company
    const byCompany = newPolicies.reduce((acc, policy) => {
        const company = policy.InsuranceCompany?.name || policy.company
        if (!acc[company]) {
            acc[company] = { count: 0, premium: 0 }
        }
        acc[company].count++
        acc[company].premium += Number(policy.premium)
        return acc
    }, {} as Record<string, { count: number; premium: number }>)

    // Group by month
    const byMonth = newPolicies.reduce((acc, policy) => {
        const month = new Date(policy.createdAt).toISOString().slice(0, 7) // YYYY-MM
        if (!acc[month]) {
            acc[month] = { count: 0, premium: 0 }
        }
        acc[month].count++
        acc[month].premium += Number(policy.premium)
        return acc
    }, {} as Record<string, { count: number; premium: number }>)

    const totalPremium = newPolicies.reduce((sum, p) => sum + Number(p.premium), 0)
    const totalCommission = newPolicies.reduce((sum, p) => sum + Number(p.commission), 0)

    // Conversion rate (ACCEPTED quotes)
    const quotesConverted = quotes.filter((q) => q.status === "ACCEPTED").length
    const conversionRate = quotes.length > 0 ? (quotesConverted / quotes.length) * 100 : 0

    return {
        period: { startDate, endDate },
        summary: {
            newPolicies: newPolicies.length,
            totalPremium,
            totalCommission,
            quotesCreated: quotes.length,
            quotesConverted,
            conversionRate: conversionRate.toFixed(1),
        },
        byType: Object.entries(byType).map(([type, data]) => ({
            type,
            ...data,
        })),
        byCompany: Object.entries(byCompany)
            .map(([company, data]) => ({
                company,
                ...data,
            }))
            .sort((a, b) => b.premium - a.premium),
        byMonth: Object.entries(byMonth)
            .map(([month, data]) => ({
                month,
                ...data,
            }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        policies: newPolicies.map((p) => ({
            id: p.id,
            number: p.number,
            clientName: `${p.Client.firstName} ${p.Client.lastName}`,
            company: p.InsuranceCompany?.name || p.company,
            type: p.type,
            premium: Number(p.premium),
            commission: Number(p.commission),
            currency: p.currency,
            createdAt: p.createdAt,
        })),
        generatedAt: new Date(),
    }
}

// ============================================
// REPORTE DE COMISIONES
// ============================================

export async function getCommissionsReport(params: DateRangeParams) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const { startDate, endDate } = params

    const commissions = await prisma.commission.findMany({
        where: {
            Policy: { tenantId },
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            Policy: {
                include: {
                    Client: {
                        select: { firstName: true, lastName: true },
                    },
                    InsuranceCompany: {
                        select: { name: true },
                    },
                },
            },
            CommissionPayment: true,
        },
        orderBy: { createdAt: "desc" },
    })

    // By status
    const byStatus = commissions.reduce((acc, comm) => {
        const status = comm.status
        if (!acc[status]) {
            acc[status] = { count: 0, amount: 0 }
        }
        acc[status].count++
        acc[status].amount += Number(comm.amount)
        return acc
    }, {} as Record<string, { count: number; amount: number }>)

    // By company
    const byCompany = commissions.reduce((acc, comm) => {
        const company = comm.Policy.InsuranceCompany?.name || comm.Policy.company
        if (!acc[company]) {
            acc[company] = { count: 0, total: 0, paid: 0, pending: 0 }
        }
        acc[company].count++
        acc[company].total += Number(comm.amount)
        acc[company].paid += Number(comm.paidAmount)
        acc[company].pending += Number(comm.pendingAmount)
        return acc
    }, {} as Record<string, { count: number; total: number; paid: number; pending: number }>)

    const totalAmount = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
    const paidAmount = commissions.reduce((sum, c) => sum + Number(c.paidAmount), 0)
    const pendingAmount = commissions.reduce((sum, c) => sum + Number(c.pendingAmount), 0)

    return {
        period: { startDate, endDate },
        summary: {
            totalCommissions: commissions.length,
            totalAmount,
            paidAmount,
            pendingAmount,
            collectionRate: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : "0",
        },
        byStatus: Object.entries(byStatus).map(([status, data]) => ({
            status,
            ...data,
        })),
        byCompany: Object.entries(byCompany)
            .map(([company, data]) => ({
                company,
                ...data,
            }))
            .sort((a, b) => b.total - a.total),
        commissions: commissions.map((c) => ({
            id: c.id,
            policyNumber: c.Policy.number,
            clientName: `${c.Policy.Client.firstName} ${c.Policy.Client.lastName}`,
            company: c.Policy.InsuranceCompany?.name || c.Policy.company,
            amount: Number(c.amount),
            paidAmount: Number(c.paidAmount),
            pendingAmount: Number(c.pendingAmount),
            currency: c.currency,
            status: c.status,
            dueDate: c.dueDate,
            createdAt: c.createdAt,
        })),
        generatedAt: new Date(),
    }
}

// ============================================
// REPORTE DE SINIESTRALIDAD
// ============================================

export async function getClaimsReport(params: DateRangeParams) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const { startDate, endDate } = params

    const claims = await prisma.claim.findMany({
        where: {
            Policy: { tenantId },
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            Policy: {
                include: {
                    Client: {
                        select: { firstName: true, lastName: true },
                    },
                    InsuranceCompany: {
                        select: { name: true },
                    },
                },
            },
        },
        orderBy: { date: "desc" },
    })

    // By status
    const byStatus = claims.reduce((acc, claim) => {
        const status = claim.status
        if (!acc[status]) {
            acc[status] = { count: 0, claimAmount: 0, approvedAmount: 0, paidAmount: 0 }
        }
        acc[status].count++
        acc[status].claimAmount += Number(claim.claimAmount || 0)
        acc[status].approvedAmount += Number(claim.approvedAmount || 0)
        acc[status].paidAmount += Number(claim.paidAmount || 0)
        return acc
    }, {} as Record<string, { count: number; claimAmount: number; approvedAmount: number; paidAmount: number }>)

    // By policy type
    const byType = claims.reduce((acc, claim) => {
        const type = claim.Policy.type
        if (!acc[type]) {
            acc[type] = { count: 0, claimAmount: 0, paidAmount: 0 }
        }
        acc[type].count++
        acc[type].claimAmount += Number(claim.claimAmount || 0)
        acc[type].paidAmount += Number(claim.paidAmount || 0)
        return acc
    }, {} as Record<string, { count: number; claimAmount: number; paidAmount: number }>)

    // By company
    const byCompany = claims.reduce((acc, claim) => {
        const company = claim.Policy.InsuranceCompany?.name || claim.Policy.company
        if (!acc[company]) {
            acc[company] = { count: 0, claimAmount: 0, paidAmount: 0 }
        }
        acc[company].count++
        acc[company].claimAmount += Number(claim.claimAmount || 0)
        acc[company].paidAmount += Number(claim.paidAmount || 0)
        return acc
    }, {} as Record<string, { count: number; claimAmount: number; paidAmount: number }>)

    const totalClaimed = claims.reduce((sum, c) => sum + Number(c.claimAmount || 0), 0)
    const totalApproved = claims.reduce((sum, c) => sum + Number(c.approvedAmount || 0), 0)
    const totalPaid = claims.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0)

    // Calculate average resolution time for resolved claims
    const resolvedClaims = claims.filter((c) => c.resolutionDate)
    const avgResolutionDays = resolvedClaims.length > 0
        ? resolvedClaims.reduce((sum, c) => {
            const days = Math.ceil(
                (new Date(c.resolutionDate!).getTime() - new Date(c.date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
            return sum + days
        }, 0) / resolvedClaims.length
        : 0

    return {
        period: { startDate, endDate },
        summary: {
            totalClaims: claims.length,
            totalClaimed,
            totalApproved,
            totalPaid,
            approvalRate: totalClaimed > 0 ? ((totalApproved / totalClaimed) * 100).toFixed(1) : "0",
            avgResolutionDays: Math.round(avgResolutionDays),
            pendingClaims: claims.filter((c) => c.status === "REPORTED" || c.status === "IN_PROCESS").length,
        },
        byStatus: Object.entries(byStatus).map(([status, data]) => ({
            status,
            ...data,
        })),
        byType: Object.entries(byType).map(([type, data]) => ({
            type,
            ...data,
        })),
        byCompany: Object.entries(byCompany)
            .map(([company, data]) => ({
                company,
                ...data,
            }))
            .sort((a, b) => b.count - a.count),
        claims: claims.map((c) => ({
            id: c.id,
            number: c.number,
            policyNumber: c.Policy.number,
            clientName: `${c.Policy.Client.firstName} ${c.Policy.Client.lastName}`,
            company: c.Policy.InsuranceCompany?.name || c.Policy.company,
            policyType: c.Policy.type,
            date: c.date,
            status: c.status,
            claimAmount: Number(c.claimAmount || 0),
            approvedAmount: Number(c.approvedAmount || 0),
            paidAmount: Number(c.paidAmount || 0),
            currency: c.currency,
            description: c.description,
        })),
        generatedAt: new Date(),
    }
}

// ============================================
// REPORTE DE RENOVACIONES
// ============================================

export async function getRenewalsReport(daysAhead: number = 60) {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const now = new Date()
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    const policies = await prisma.policy.findMany({
        where: {
            tenantId,
            status: "ACTIVE",
            endDate: {
                gte: now,
                lte: futureDate,
            },
        },
        include: {
            Client: {
                select: { firstName: true, lastName: true, rut: true, email: true, phone: true },
            },
            InsuranceCompany: {
                select: { name: true },
            },
        },
        orderBy: { endDate: "asc" },
    })

    // Group by urgency
    const critical = policies.filter((p) => {
        const days = Math.ceil(
            (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return days <= 15
    })

    const upcoming = policies.filter((p) => {
        const days = Math.ceil(
            (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return days > 15 && days <= 30
    })

    const planned = policies.filter((p) => {
        const days = Math.ceil(
            (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return days > 30
    })

    // By company
    const byCompany = policies.reduce((acc, policy) => {
        const company = policy.InsuranceCompany?.name || policy.company
        if (!acc[company]) {
            acc[company] = { count: 0, premium: 0 }
        }
        acc[company].count++
        acc[company].premium += Number(policy.premium)
        return acc
    }, {} as Record<string, { count: number; premium: number }>)

    const totalPremium = policies.reduce((sum, p) => sum + Number(p.premium), 0)

    return {
        summary: {
            totalRenewals: policies.length,
            criticalCount: critical.length,
            upcomingCount: upcoming.length,
            plannedCount: planned.length,
            totalPremiumAtRisk: totalPremium,
        },
        critical: critical.map((p) => ({
            id: p.id,
            number: p.number,
            clientName: `${p.Client.firstName} ${p.Client.lastName}`,
            clientRut: p.Client.rut,
            clientEmail: p.Client.email,
            clientPhone: p.Client.phone,
            company: p.InsuranceCompany?.name || p.company,
            type: p.type,
            premium: Number(p.premium),
            currency: p.currency,
            endDate: p.endDate,
            daysRemaining: Math.ceil(
                (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
        })),
        upcoming: upcoming.map((p) => ({
            id: p.id,
            number: p.number,
            clientName: `${p.Client.firstName} ${p.Client.lastName}`,
            clientRut: p.Client.rut,
            company: p.InsuranceCompany?.name || p.company,
            type: p.type,
            premium: Number(p.premium),
            currency: p.currency,
            endDate: p.endDate,
            daysRemaining: Math.ceil(
                (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
        })),
        planned: planned.map((p) => ({
            id: p.id,
            number: p.number,
            clientName: `${p.Client.firstName} ${p.Client.lastName}`,
            company: p.InsuranceCompany?.name || p.company,
            type: p.type,
            premium: Number(p.premium),
            currency: p.currency,
            endDate: p.endDate,
            daysRemaining: Math.ceil(
                (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
        })),
        byCompany: Object.entries(byCompany)
            .map(([company, data]) => ({
                company,
                ...data,
            }))
            .sort((a, b) => b.count - a.count),
        generatedAt: new Date(),
    }
}

// Helper to log export
export async function logReportExport(reportType: string, format: string, filters?: Record<string, unknown>) {
    const tenantId = await getTenantContext()
    if (tenantId) {
        await logExport(tenantId, reportType, format, filters)
    }
}
