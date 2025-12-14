import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { addDays, differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { sendEmail, generateRenewalAlertEmail, generateRenewalSummaryEmail } from "@/lib/email"

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// To protect it, we use a secret token
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
    // Verify the cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const today = new Date()
        const in60Days = addDays(today, 60)

        // Get all tenants with their renewal alert settings
        const tenants = await prisma.tenant.findMany({
            where: {
                subscriptionStatus: { not: "CANCELED" },
            },
            include: {
                User: {
                    where: {
                        role: { in: ["BROKERAGE_ADMIN", "SUPER_ADMIN"] },
                    },
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        })

        const results = {
            processed: 0,
            emailsSent: 0,
            errors: [] as string[],
        }

        for (const tenant of tenants) {
            // Get policies nearing expiration for this tenant
            const policies = await prisma.policy.findMany({
                where: {
                    tenantId: tenant.id,
                    status: "ACTIVE",
                    endDate: {
                        gte: today,
                        lte: in60Days,
                    },
                },
                include: {
                    Client: true,
                    InsuranceCompany: true,
                },
                orderBy: {
                    endDate: "asc",
                },
            })

            if (policies.length === 0) continue

            results.processed += policies.length

            // Categorize policies
            const criticalPolicies = policies.filter(
                (p) => differenceInDays(p.endDate, today) <= 15
            )
            const upcomingPolicies = policies.filter(
                (p) => differenceInDays(p.endDate, today) > 15
            )

            // Get admin emails
            const adminEmails = tenant.User
                .map((u) => u.email)
                .filter(Boolean) as string[]

            if (adminEmails.length === 0) continue

            // Option 1: Send individual alerts for critical policies (7 days or less)
            const veryUrgentPolicies = criticalPolicies.filter(
                (p) => differenceInDays(p.endDate, today) <= 7
            )

            for (const policy of veryUrgentPolicies) {
                const daysRemaining = differenceInDays(policy.endDate, today)
                const emailHtml = generateRenewalAlertEmail({
                    brokerageName: tenant.name,
                    clientName: `${policy.Client.firstName} ${policy.Client.lastName}`,
                    policyNumber: policy.number,
                    company: policy.InsuranceCompany?.name || policy.company,
                    expirationDate: format(policy.endDate, "PPP", { locale: es }),
                    daysRemaining,
                    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/renewals`,
                })

                const result = await sendEmail({
                    to: adminEmails,
                    subject: `⚠️ URGENTE: Póliza ${policy.number} vence en ${daysRemaining} días`,
                    html: emailHtml,
                })

                if (result.success) {
                    results.emailsSent++
                } else {
                    results.errors.push(`Failed to send email for policy ${policy.number}: ${result.error}`)
                }
            }

            // Option 2: Send weekly summary email (if today is Monday)
            const isMonday = today.getDay() === 1
            if (isMonday && policies.length > 0) {
                const summaryHtml = generateRenewalSummaryEmail({
                    brokerageName: tenant.name,
                    totalPolicies: policies.length,
                    criticalPolicies: criticalPolicies.map((p) => ({
                        clientName: `${p.Client.firstName} ${p.Client.lastName}`,
                        policyNumber: p.number,
                        company: p.InsuranceCompany?.name || p.company,
                        daysRemaining: differenceInDays(p.endDate, today),
                    })),
                    upcomingPolicies: upcomingPolicies.slice(0, 10).map((p) => ({
                        clientName: `${p.Client.firstName} ${p.Client.lastName}`,
                        policyNumber: p.number,
                        company: p.InsuranceCompany?.name || p.company,
                        daysRemaining: differenceInDays(p.endDate, today),
                    })),
                    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/renewals`,
                })

                const result = await sendEmail({
                    to: adminEmails,
                    subject: `📊 Resumen semanal: ${policies.length} pólizas próximas a vencer`,
                    html: summaryHtml,
                })

                if (result.success) {
                    results.emailsSent++
                } else {
                    results.errors.push(`Failed to send summary for tenant ${tenant.name}: ${result.error}`)
                }
            }

            // Mark expired policies
            const expiredPolicies = await prisma.policy.findMany({
                where: {
                    tenantId: tenant.id,
                    status: "ACTIVE",
                    endDate: {
                        lt: today,
                    },
                },
            })

            if (expiredPolicies.length > 0) {
                await prisma.policy.updateMany({
                    where: {
                        id: { in: expiredPolicies.map((p) => p.id) },
                    },
                    data: {
                        status: "EXPIRED",
                    },
                })
            }
        }

        return NextResponse.json({
            success: true,
            ...results,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// Also support POST for some cron providers
export async function POST(request: Request) {
    return GET(request)
}
