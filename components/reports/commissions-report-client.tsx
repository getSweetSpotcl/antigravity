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
import { DollarSign, CheckCircle, Clock, FileText, Loader2 } from "lucide-react"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ReportFilters } from "./report-filters"
import { getCommissionsReport } from "@/actions/reports"
import { exportToExcel, reportExportConfigs } from "@/lib/export"
import { toast } from "sonner"
import { CommissionsBarChart } from "./charts/commissions-bar-chart"
import { CommissionsDonutChart } from "./charts/commissions-donut-chart"

type CommissionsData = Awaited<ReturnType<typeof getCommissionsReport>>

const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    PARTIAL: "Parcial",
    PAID: "Pagado",
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PARTIAL: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
}

export function CommissionsReportClient() {
    const [data, setData] = useState<CommissionsData>(null)
    const [isPending, startTransition] = useTransition()
    const [dateRange, setDateRange] = useState({
        startDate: startOfMonth(new Date()),
        endDate: new Date(),
    })

    const loadReport = (startDate: Date, endDate: Date) => {
        setDateRange({ startDate, endDate })
        startTransition(async () => {
            const result = await getCommissionsReport({ startDate, endDate })
            setData(result)
        })
    }

    const handleExport = (format: "excel" | "pdf") => {
        if (!data) return

        if (format === "excel") {
            exportToExcel({
                filename: `Comisiones_${dateRange.startDate.toISOString().slice(0, 10)}_${dateRange.endDate.toISOString().slice(0, 10)}`,
                sheetName: "Comisiones",
                columns: reportExportConfigs.commissions,
                data: data.commissions,
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
                                <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.summary.totalAmount.toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    UF
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {data.summary.totalCommissions} comisiones
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {data.summary.paidAmount.toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    UF
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
                                <Clock className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">
                                    {data.summary.pendingAmount.toLocaleString("es-CL", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    UF
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.summary.collectionRate}%</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <CommissionsDonutChart
                            paidAmount={data.summary.paidAmount}
                            pendingAmount={data.summary.pendingAmount}
                        />
                        <CommissionsBarChart data={data.byStatus} />
                    </div>

                    {/* By Status & Company Tables */}
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
                                            <TableHead className="text-right">Monto</TableHead>
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
                                                    {item.amount.toLocaleString("es-CL", {
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Por Compañía</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Compañía</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Pendiente</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.byCompany.slice(0, 10).map((item) => (
                                            <TableRow key={item.company}>
                                                <TableCell className="font-medium">{item.company}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.total.toLocaleString("es-CL", {
                                                        minimumFractionDigits: 2,
                                                    })}{" "}
                                                    UF
                                                </TableCell>
                                                <TableCell className="text-right text-amber-600">
                                                    {item.pending.toLocaleString("es-CL", {
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
                    </div>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle de Comisiones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Póliza</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Compañía</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Pagado</TableHead>
                                        <TableHead className="text-right">Pendiente</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.commissions.slice(0, 50).map((comm) => (
                                        <TableRow key={comm.id}>
                                            <TableCell className="font-medium">{comm.policyNumber}</TableCell>
                                            <TableCell>{comm.clientName}</TableCell>
                                            <TableCell>{comm.company}</TableCell>
                                            <TableCell className="text-right">
                                                {comm.amount.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}{" "}
                                                {comm.currency}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {comm.paidAmount.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right text-amber-600">
                                                {comm.pendingAmount.toLocaleString("es-CL", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[comm.status]}>
                                                    {statusLabels[comm.status] || comm.status}
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
