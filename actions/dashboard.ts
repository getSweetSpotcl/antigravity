"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { addDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns"

export const getDashboardStats = async () => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return null
    }

    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    // Run all queries in parallel
    const [
        totalClients,
        activePolicies,
        monthlyPremiums,
        activeClaims,
        policiesExpiringSoon,
        recentQuotes,
    ] = await Promise.all([
        // Total clients
        prisma.client.count({
            where: { tenantId },
        }),

        // Active policies
        prisma.policy.count({
            where: { tenantId, status: "ACTIVE" },
        }),

        // Monthly premiums (policies created this month)
        prisma.policy.aggregate({
            where: {
                tenantId,
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
            _sum: {
                premium: true,
            },
        }),

        // Active claims (not closed)
        prisma.claim.count({
            where: {
                tenantId,
                status: { notIn: ["CLOSED", "REJECTED"] },
            },
        }),

        // Policies expiring in next 30 days
        prisma.policy.count({
            where: {
                tenantId,
                status: "ACTIVE",
                endDate: {
                    gte: today,
                    lte: addDays(today, 30),
                },
            },
        }),

        // Recent quotes (this month)
        prisma.quote.count({
            where: {
                tenantId,
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        }),
    ])

    // Calculate monthly commissions
    const monthlyCommissions = await prisma.policy.aggregate({
        where: {
            tenantId,
            createdAt: {
                gte: monthStart,
                lte: monthEnd,
            },
        },
        _sum: {
            commission: true,
        },
    })

    return {
        totalClients,
        activePolicies,
        monthlyPremiums: Number(monthlyPremiums._sum.premium) || 0,
        monthlyCommissions: Number(monthlyCommissions._sum.commission) || 0,
        activeClaims,
        policiesExpiringSoon,
        recentQuotes,
    }
}

export const getRenewalAlerts = async (limit: number = 5) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    const today = new Date()
    const in30Days = addDays(today, 30)

    const policies = await prisma.policy.findMany({
        where: {
            tenantId,
            status: "ACTIVE",
            endDate: {
                gte: today,
                lte: in30Days,
            },
        },
        include: {
            Client: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
            InsuranceCompany: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            endDate: "asc",
        },
        take: limit,
    })

    return policies.map((policy) => ({
        id: policy.id,
        number: policy.number,
        clientName: `${policy.Client.firstName} ${policy.Client.lastName}`,
        company: policy.InsuranceCompany?.name || policy.company,
        endDate: policy.endDate,
        daysRemaining: differenceInDays(policy.endDate, today),
        type: policy.type,
    }))
}

export const getRecentActivity = async (limit: number = 10) => {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return []
    }

    // Get recent policies, claims, and quotes
    const [recentPolicies, recentClaims, recentQuotes] = await Promise.all([
        prisma.policy.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                Client: { select: { firstName: true, lastName: true } },
            },
        }),
        prisma.claim.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                Policy: { select: { number: true } },
            },
        }),
        prisma.quote.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                Client: { select: { firstName: true, lastName: true } },
            },
        }),
    ])

    // Combine and sort by date
    const activities = [
        ...recentPolicies.map((p) => ({
            type: "policy" as const,
            id: p.id,
            title: `Nueva póliza ${p.number}`,
            description: `${p.Client.firstName} ${p.Client.lastName}`,
            date: p.createdAt,
        })),
        ...recentClaims.map((c) => ({
            type: "claim" as const,
            id: c.id,
            title: `Siniestro ${c.number || "reportado"}`,
            description: `Póliza ${c.Policy.number}`,
            date: c.createdAt,
        })),
        ...recentQuotes.map((q) => ({
            type: "quote" as const,
            id: q.id,
            title: `Cotización ${q.quoteNumber || "nueva"}`,
            description: q.Client
                ? `${q.Client.firstName} ${q.Client.lastName}`
                : q.prospectName || "Sin cliente",
            date: q.createdAt,
        })),
    ]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit)

    return activities
}
