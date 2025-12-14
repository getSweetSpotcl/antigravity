"use client"

import { useState, useTransition } from "react"
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
import { TrendingUp, FileText, Target, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ReportFilters } from "./report-filters"
import { getProductionReport } from "@/actions/reports"
import { exportToExcel, reportExportConfigs } from "@/lib/export"
import { toast } from "sonner"

type ProductionData = Awaited<ReturnType<typeof getProductionReport>>

const typeLabels: Record<string, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automotriz",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

export function ProductionReportClient() {
    const [data, setData] = useState<ProductionData>(null)
    const [isPending, startTransition] = useTransition()
    const [dateRange, setDateRange] = useState({
        startDate: startOfMonth(new Date()),
        endDate: new Date(),
    })

    const loadReport = (startDate: Date, endDate: Date) => {
        setDateRange({ startDate, endDate })
        startTransition(async () => {
            const result = await getProductionReport({ startDate, endDate })
            setData(result)
        })
    }

    const handleExport = (format: "excel" | "pdf") => {
        if (!data) return

        if (format === "excel") {
            exportToExcel({
                filename: `Produccion_${dateRange.startDate.toISOString().slice(0, 10)}_${dateRange.endDate.toISOString().slice(0, 10)}`,
                sheetName: "Producción",
                columns: reportExportConfigs.policies,
                data: data.policies,
            })
            toast.success("Reporte exportado a Excel")
        } else {
            toast.info("Exportación a PDF próximamente")
        }
    }

    return (
        <div className="space-y-6">
            <ReportFilters
                onDateRangeChange={loadReport}
                onExport={handleExport}
                isLoading={isPending}
            />

            {isPending ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : !data ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Selecciona un período para generar el reporte
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pólizas Nuevas</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.summary.newPolicies}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Prima Total</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
                                <CardTitle className="text-sm font-medium">Comisión Generada</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {data.summary.totalCommission.toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    UF
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.summary.conversionRate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    {data.summary.quotesConverted} de {data.summary.quotesCreated} cotizaciones
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="by-type" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="by-type">Por Ramo</TabsTrigger>
                            <TabsTrigger value="by-company">Por Compañía</TabsTrigger>
                            <TabsTrigger value="by-month">Por Mes</TabsTrigger>
                            <TabsTrigger value="details">Detalle</TabsTrigger>
                        </TabsList>

                        <TabsContent value="by-type">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Producción por Ramo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ramo</TableHead>
                                                <TableHead className="text-right">Cantidad</TableHead>
                                                <TableHead className="text-right">Prima</TableHead>
                                                <TableHead className="text-right">Comisión</TableHead>
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
                                                    <TableCell className="text-right">
                                                        {item.commission.toLocaleString("es-CL", {
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

                        <TabsContent value="by-company">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Producción por Compañía</CardTitle>
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

                        <TabsContent value="by-month">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Producción Mensual</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mes</TableHead>
                                                <TableHead className="text-right">Pólizas</TableHead>
                                                <TableHead className="text-right">Prima</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.byMonth.map((item) => (
                                                <TableRow key={item.month}>
                                                    <TableCell className="font-medium">{item.month}</TableCell>
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

                        <TabsContent value="details">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalle de Pólizas</CardTitle>
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
                                                <TableHead>Fecha</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.policies.slice(0, 50).map((policy) => (
                                                <TableRow key={policy.id}>
                                                    <TableCell className="font-medium">{policy.number}</TableCell>
                                                    <TableCell>{policy.clientName}</TableCell>
                                                    <TableCell>{policy.company}</TableCell>
                                                    <TableCell>{typeLabels[policy.type] || policy.type}</TableCell>
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
                                                    <TableCell>
                                                        {format(new Date(policy.createdAt), "dd/MM/yyyy")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <p className="text-xs text-muted-foreground text-right">
                        Generado: {format(new Date(data.generatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                </>
            )}
        </div>
    )
}
