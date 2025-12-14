"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { differenceInDays } from "date-fns"

export interface PolicyNotification {
    id: string
    number: string
    clientName: string
    company: string
    endDate: Date
    daysRemaining: number
}

export interface ClaimNotification {
    id: string
    number: string | null
    policyNumber: string
    clientName: string
    status: string
    date: Date
}

export interface CommissionNotification {
    id: string
    policyNumber: string
    clientName: string
    amount: number
    currency: string
    dueDate: Date | null
    daysOverdue: number
}

export interface NotificationsData {
    policies: PolicyNotification[]
    claims: ClaimNotification[]
    commissions: CommissionNotification[]
    total: number
}

export async function getNotifications(): Promise<NotificationsData> {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return {
            policies: [],
            claims: [],
            commissions: [],
            total: 0,
        }
    }

    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Fetch all in parallel
    const [policiesNearExpiration, pendingClaims, overdueCommissions] = await Promise.all([
        // Policies expiring in next 7 days
        prisma.policy.findMany({
            where: {
                tenantId,
                status: "ACTIVE",
                endDate: {
                    gte: now,
                    lte: sevenDaysFromNow,
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
            take: 5,
        }),

        // Claims in REPORTED or IN_PROCESS status
        prisma.claim.findMany({
            where: {
                tenantId,
                status: {
                    in: ["REPORTED", "IN_PROCESS"],
                },
            },
            include: {
                Policy: {
                    select: {
                        number: true,
                        Client: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        }),

        // Overdue commissions
        prisma.commission.findMany({
            where: {
                tenantId,
                status: "OVERDUE",
            },
            include: {
                Policy: {
                    select: {
                        number: true,
                        Client: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                dueDate: "asc",
            },
            take: 5,
        }),
    ])

    // Transform policies
    const policies: PolicyNotification[] = policiesNearExpiration.map((policy) => ({
        id: policy.id,
        number: policy.number,
        clientName: `${policy.Client.firstName} ${policy.Client.lastName}`,
        company: policy.InsuranceCompany?.name || policy.company,
        endDate: policy.endDate,
        daysRemaining: differenceInDays(policy.endDate, now),
    }))

    // Transform claims
    const claims: ClaimNotification[] = pendingClaims.map((claim) => ({
        id: claim.id,
        number: claim.number,
        policyNumber: claim.Policy.number,
        clientName: `${claim.Policy.Client.firstName} ${claim.Policy.Client.lastName}`,
        status: claim.status,
        date: claim.date,
    }))

    // Transform commissions
    const commissions: CommissionNotification[] = overdueCommissions.map((commission) => ({
        id: commission.id,
        policyNumber: commission.Policy.number,
        clientName: `${commission.Policy.Client.firstName} ${commission.Policy.Client.lastName}`,
        amount: Number(commission.pendingAmount),
        currency: commission.currency,
        dueDate: commission.dueDate,
        daysOverdue: commission.dueDate ? differenceInDays(now, commission.dueDate) : 0,
    }))

    return {
        policies,
        claims,
        commissions,
        total: policies.length + claims.length + commissions.length,
    }
}
