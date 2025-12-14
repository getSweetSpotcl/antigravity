import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
    FileText,
    AlertTriangle,
    Wallet,
    FileCheck
} from "lucide-react"
import { getDashboardStats, getRenewalAlerts, getRecentActivity } from "@/actions/dashboard"
import { getCommissionsDashboardSummary } from "@/actions/commission"
import { getAgentCommissionsDashboardSummary } from "@/actions/agent-commission"
import { RenewalAlerts } from "@/components/dashboard/renewal-alerts"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { CommissionsWidget } from "@/components/dashboard/commissions-widget"
import { StatCard } from "@/components/dashboard/stat-card"
import { serializeDecimal, serializeList } from "@/lib/serialize"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const [stats, renewalAlertsRaw, recentActivity, commissionsSummaryRaw, agentCommissionsSummary] = await Promise.all([
        getDashboardStats(),
        getRenewalAlerts(5),
        getRecentActivity(8),
        getCommissionsDashboardSummary(),
        getAgentCommissionsDashboardSummary(),
    ])

    const renewalAlerts = serializeList(renewalAlertsRaw)
    const commissionsSummary = serializeDecimal(commissionsSummaryRaw)

    return (
        <div className="flex-1 space-y-8">
            {/* Header Section */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
                <p className="text-slate-500 dark:text-slate-400">Resumen de operaciones</p>
            </div>

            {/* Primary Stats - 4 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Pólizas Activas"
                    value={stats?.activePolicies || 0}
                    icon={FileCheck}
                    iconBgColor="bg-sky-100 dark:bg-sky-900/30"
                    iconColor="text-sky-600 dark:text-sky-400"
                />

                <StatCard
                    title="Cotizaciones"
                    value={stats?.recentQuotes || 0}
                    icon={FileText}
                    iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />

                <StatCard
                    title="Siniestros Activos"
                    value={stats?.activeClaims || 0}
                    icon={AlertTriangle}
                    trend={(stats?.activeClaims || 0) > 0 ? { value: -(stats?.activeClaims || 0) } : undefined}
                    iconBgColor="bg-amber-100 dark:bg-amber-900/30"
                    iconColor="text-amber-600 dark:text-amber-400"
                />

                <StatCard
                    title="Comisiones del Mes"
                    value={`${(stats?.monthlyCommissions || 0).toLocaleString("es-CL", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    })} UF`}
                    icon={Wallet}
                    iconBgColor="bg-violet-100 dark:bg-violet-900/30"
                    iconColor="text-violet-600 dark:text-violet-400"
                />
            </div>

            {/* Alerts and Commissions Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <RenewalAlerts alerts={renewalAlerts} />
                <CommissionsWidget summary={commissionsSummary} agentSummary={agentCommissionsSummary} />
            </div>

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />
        </div>
    )
}
