import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSalesReport } from "@/actions/report"
import { SalesChart } from "@/components/reports/sales-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, FileText, TrendingUp } from "lucide-react"

import { FecuReportDialog } from "@/components/reports/fecu-dialog"

export default async function ReportsPage() {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const summary = await getSalesReport()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reportes de Ventas</h2>
                <div className="flex items-center space-x-2">
                    <FecuReportDialog />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Primas Totales (Año)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalPremiums.toFixed(2)} UF</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% respecto al mes pasado
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Comisiones Totales
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalCommissions.toFixed(2)} UF</div>
                        <p className="text-xs text-muted-foreground">
                            Promedio 12% comisión
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pólizas Emitidas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalPolicies}</div>
                        <p className="text-xs text-muted-foreground">
                            En el año actual
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Clientes Activos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.activeClients}</div>
                        <p className="text-xs text-muted-foreground">
                            Total cartera vigente
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <SalesChart data={summary.monthlyMetrics} />
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Desempeño Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {summary.monthlyMetrics.slice(-5).reverse().map((metric) => (
                                <div className="flex items-center" key={metric.month}>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{metric.month}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {metric.policyCount} pólizas emitidas
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        +{metric.premiums.toFixed(2)} UF
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
