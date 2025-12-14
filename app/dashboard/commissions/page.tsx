import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCommissions, getPoliciesForCommission, getCommissionStats } from "@/actions/commission"
import { getAgentCommissionsDashboardSummary } from "@/actions/agent-commission"
import { CommissionList } from "@/components/commissions/commission-list"
import { GenerateCommissionDialog } from "@/components/commissions/generate-commission-dialog"
import { serializeList } from "@/lib/serialize"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function CommissionsPage() {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const [commissionsRaw, policiesRaw, agentStats] = await Promise.all([
        getCommissions(),
        getPoliciesForCommission(),
        getAgentCommissionsDashboardSummary(),
    ])

    const commissions = serializeList(commissionsRaw)
    const policies = serializeList(policiesRaw)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-sky-600" />
                        Comisiones de Corredora
                    </h1>
                    <p className="text-slate-500">
                        Gestiona las comisiones por cobrar y registra los pagos recibidos.
                    </p>
                </div>
                <GenerateCommissionDialog policies={policies} />
            </div>

            {/* Agent Commission Summary Card */}
            <Card className="bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-sky-800 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Comisiones de Vendedores
                        </CardTitle>
                        <Link href="/dashboard/commissions/agents">
                            <Button variant="outline" size="sm" className="bg-white hover:bg-sky-50">
                                Ver todas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {(agentStats?.pending?.count ?? 0) + (agentStats?.overdue?.count ?? 0)}
                            </p>
                            <p className="text-sm text-slate-600">Total Pendientes</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">
                                {agentStats?.pending?.count ?? 0}
                            </p>
                            <p className="text-sm text-slate-600">Por Pagar</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">
                                {agentStats?.overdue?.count ?? 0}
                            </p>
                            <p className="text-sm text-slate-600">Vencidas</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">
                                {((agentStats?.pending?.amount ?? 0) + (agentStats?.overdue?.amount ?? 0)).toFixed(2)} UF
                            </p>
                            <p className="text-sm text-slate-600">Monto Pendiente</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Brokerage Commission List */}
            <CommissionList commissions={commissions} />
        </div>
    )
}
