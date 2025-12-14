"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AlertTriangle, CheckCircle, Clock, FileText, Loader2, DollarSign } from "lucide-react"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ReportFilters } from "./report-filters"
import { getClaimsReport } from "@/actions/reports"
import { exportToExcel, reportExportConfigs } from "@/lib/export"
import { toast } from "sonner"

type ClaimsData = Awaited<ReturnType<typeof getClaimsReport>>

const statusLabels: Record<string, string> = {
    REPORTED: "Denunciado",
    IN_PROCESS: "En Proceso",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    PAID: "Pagado",
}

const statusColors: Record<string, string> = {
    REPORTED: "bg-yellow-100 text-yellow-800",
    IN_PROCESS: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PAID: "bg-emerald-100 text-emerald-800",
}

const typeLabels: Record<string, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automotriz",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

export function ClaimsReportClient() {
    const [data, setData] = useState<ClaimsData>(null)
    const [isPending, startTransition] = useTransition()
    const [dateRange, setDateRange] = useState({
        startDate: startOfMonth(new Date()),
        endDate: new Date(),
    })

    const loadReport = (startDate: Date, endDate: Date) => {
        setDateRange({ startDate, endDate })
        startTransition(async () => {
            const result = await getClaimsReport({ startDate, endDate })
            setData(result)
        })
    }

    const handleExport = (format: "excel" | "pdf") => {
        if (!data) return

        if (format === "excel") {
            exportToExcel({
                filename: `Siniestros_${dateRange.startDate.toISOString().slice(0, 10)}_${dateRange.endDate.toISOString().slice(0, 10)}`,
                sheetName: "Siniestros",
                columns: reportExportConfigs.claims,
                data: data.claims,
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Siniestros</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.summary.totalClaims}</div>
                                <p className="text-xs text-muted-foreground">
                                    {data.summary.pendingClaims} pendientes
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Monto Reclamado</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.summary.totalClaimed.toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    UF
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Monto Aprobado</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {data.summary.totalApproved.toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    UF
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasa Aprobación</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.summary.approvalRate}%</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Resolución Promedio</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.summary.avgResolutionDays}</div>
                                <p className="text-xs text-muted-foreground">días</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* By Status and Type */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Por Estado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Reclamado</TableHead>
                                            <TableHead className="text-right">Pagado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.byStatus.map((item) => (
                                            <TableRow key={item.status}>
                                                <TableCell>
                                                    <Badge className={statusColors[item.status]}>
                                                        {statusLabels[item.status] || item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{item.count}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.claimAmount.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {item.paidAmount.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Por Ramo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ramo</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Reclamado</TableHead>
                                            <TableHead className="text-right">Pagado</TableHead>
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
                                                    {item.claimAmount.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {item.paidAmount.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle de Siniestros</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>N° Siniestro</TableHead>
                                        <TableHead>Póliza</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Ramo</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Reclamado</TableHead>
                                        <TableHead className="text-right">Pagado</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.claims.slice(0, 50).map((claim) => (
                                        <TableRow key={claim.id}>
                                            <TableCell className="font-medium">
                                                {claim.number || claim.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>{claim.policyNumber}</TableCell>
                                            <TableCell>{claim.clientName}</TableCell>
                                            <TableCell>
                                                {typeLabels[claim.policyType] || claim.policyType}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(claim.date), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {claim.claimAmount.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}{" "}
                                                {claim.currency}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {claim.paidAmount.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[claim.status]}>
                                                    {statusLabels[claim.status] || claim.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground text-right">
                        Generado: {format(new Date(data.generatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                </>
            )}
        </div>
    )
}
