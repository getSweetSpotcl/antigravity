"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, AlertTriangle, Building2, PieChart as PieChartIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getPortfolioReport } from "@/actions/reports"
import { PortfolioPieChart } from "./charts/portfolio-pie-chart"

type PortfolioData = Awaited<ReturnType<typeof getPortfolioReport>>

const typeLabels: Record<string, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automotriz",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

export function PortfolioReport() {
    const [data, setData] = useState<PortfolioData>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const result = await getPortfolioReport()
            setData(result)
        })
    }, [])

    if (isPending || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pólizas Activas</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.totalPolicies}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Prima Total</CardTitle>
                        <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary.totalPremium.toLocaleString("es-CL", {
                                minimumFractionDigits: 2,
                            })}{" "}
                            UF
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comisión Total</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary.totalCommission.toLocaleString("es-CL", {
                                minimumFractionDigits: 2,
                            })}{" "}
                            UF
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Por Vencer (30d)</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {data.summary.expiringSoonCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="by-type" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="by-type">Por Ramo</TabsTrigger>
                    <TabsTrigger value="by-company">Por Compañía</TabsTrigger>
                    <TabsTrigger value="expiring">Por Vencer</TabsTrigger>
                    <TabsTrigger value="all">Todas las Pólizas</TabsTrigger>
                </TabsList>

                <TabsContent value="by-type">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Chart */}
                        <PortfolioPieChart data={data.byType} />

                        {/* Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalle por Ramo</CardTitle>
                                <CardDescription>
                                    Pólizas activas agrupadas por tipo de seguro
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ramo</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Prima Total</TableHead>
                                            <TableHead className="text-right">% Cartera</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.byType.map((item) => (
                                            <TableRow key={item.type}>
                                                <TableCell className="font-medium">
                                                    {typeLabels[item.type] || item.type}
                                                </TableCell>
                                                <TableCell className="text-right">{item.count}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.premium.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}{" "}
                                                    UF
                                                </TableCell>
                                                <TableCell className="text-right">{item.percentage}%</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="by-company">
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribución por Compañía</CardTitle>
                            <CardDescription>
                                Pólizas activas agrupadas por aseguradora
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Compañía</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Prima Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.byCompany.map((item) => (
                                        <TableRow key={item.company}>
                                            <TableCell className="font-medium">{item.company}</TableCell>
                                            <TableCell className="text-right">{item.count}</TableCell>
                                            <TableCell className="text-right">
                                                {item.premium.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}{" "}
                                                UF
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expiring">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pólizas por Vencer</CardTitle>
                            <CardDescription>
                                Próximas 30 días - requieren gestión de renovación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.expiringSoon.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No hay pólizas por vencer en los próximos 30 días
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Póliza</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Compañía</TableHead>
                                            <TableHead>Ramo</TableHead>
                                            <TableHead className="text-right">Prima</TableHead>
                                            <TableHead className="text-right">Vence</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.expiringSoon.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell className="font-medium">
                                                    {policy.number}
                                                </TableCell>
                                                <TableCell>
                                                    {policy.clientName}
                                                    <br />
                                                    <span className="text-xs text-muted-foreground">
                                                        {policy.clientRut}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{policy.company}</TableCell>
                                                <TableCell>
                                                    {typeLabels[policy.type] || policy.type}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {policy.premium.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}{" "}
                                                    {policy.currency}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge
                                                        variant={
                                                            policy.daysRemaining <= 7
                                                                ? "destructive"
                                                                : policy.daysRemaining <= 15
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                    >
                                                        {policy.daysRemaining} días
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <CardTitle>Todas las Pólizas Activas</CardTitle>
                            <CardDescription>
                                Listado completo de la cartera vigente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Póliza</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Compañía</TableHead>
                                        <TableHead>Ramo</TableHead>
                                        <TableHead className="text-right">Prima</TableHead>
                                        <TableHead className="text-right">Comisión</TableHead>
                                        <TableHead>Vigencia</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.policies.slice(0, 50).map((policy) => (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">
                                                {policy.number}
                                            </TableCell>
                                            <TableCell>
                                                {policy.clientName}
                                                <br />
                                                <span className="text-xs text-muted-foreground">
                                                    {policy.clientRut}
                                                </span>
                                            </TableCell>
                                            <TableCell>{policy.company}</TableCell>
                                            <TableCell>
                                                {typeLabels[policy.type] || policy.type}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {policy.premium.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}{" "}
                                                {policy.currency}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {policy.commission.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}{" "}
                                                {policy.currency}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(policy.startDate), "dd/MM/yy")} -{" "}
                                                {format(new Date(policy.endDate), "dd/MM/yy")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {data.policies.length > 50 && (
                                <p className="text-center text-sm text-muted-foreground mt-4">
                                    Mostrando 50 de {data.policies.length} pólizas
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground text-right">
                Generado: {format(new Date(data.generatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </p>
        </div>
    )
}
