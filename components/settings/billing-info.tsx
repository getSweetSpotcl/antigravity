"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BillingInfoProps {
    data: {
        tenant: any
        monthlyAmount: number
        planName: string
        billingRecords: any[]
    }
}

export function BillingInfo({ data }: BillingInfoProps) {
    const { tenant, monthlyAmount, planName, billingRecords } = data

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge variant="default">Pagado</Badge>
            case "PENDING":
                return <Badge variant="secondary">Pendiente</Badge>
            case "OVERDUE":
                return <Badge variant="destructive">Vencido</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getSubscriptionStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge variant="default">Activo</Badge>
            case "TRIAL":
                return <Badge variant="secondary">Prueba</Badge>
            case "PAST_DUE":
                return <Badge variant="destructive">Pago Pendiente</Badge>
            case "SUSPENDED":
                return <Badge variant="destructive">Suspendido</Badge>
            case "CANCELED":
                return <Badge variant="outline">Cancelado</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Plan Actual */}
            <Card>
                <CardHeader>
                    <CardTitle>Plan de Suscripción</CardTitle>
                    <CardDescription>Detalles de tu plan actual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Plan</p>
                            <p className="text-lg font-semibold">{planName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Estado</p>
                            <div className="mt-1">
                                {getSubscriptionStatusBadge(tenant.subscriptionStatus)}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pago Mensual</p>
                            <p className="text-lg font-semibold">${monthlyAmount.toLocaleString("es-CL")}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Día de Facturación</p>
                            <p className="text-lg font-semibold">Día {tenant.billingDay || 1}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Usuarios</p>
                            <p className="text-lg font-semibold">{tenant.maxUsers} usuarios</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Próxima Facturación</p>
                            <p className="text-lg font-semibold">
                                {tenant.nextBillingDate
                                    ? format(new Date(tenant.nextBillingDate), "dd MMM yyyy", { locale: es })
                                    : "No programado"}
                            </p>
                        </div>
                    </div>

                    {tenant.discountType && tenant.discountValue && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Descuento Aplicado</p>
                            <p className="text-md font-medium text-green-600">
                                {tenant.discountType === "PERCENTAGE"
                                    ? `${tenant.discountValue}% de descuento`
                                    : `$${tenant.discountValue.toLocaleString("es-CL")} de descuento`}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Datos de Facturación */}
            <Card>
                <CardHeader>
                    <CardTitle>Datos de Facturación</CardTitle>
                    <CardDescription>Información para facturación y pagos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div>
                        <p className="text-sm text-muted-foreground">RUT</p>
                        <p className="font-medium">{tenant.rut || "No registrado"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Email de Facturación</p>
                        <p className="font-medium">{tenant.billingEmail || "No registrado"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Dirección de Facturación</p>
                        <p className="font-medium">{tenant.billingAddress || "No registrada"}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Historial de Pagos */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Pagos</CardTitle>
                    <CardDescription>Últimas facturas y pagos realizados</CardDescription>
                </CardHeader>
                <CardContent>
                    {billingRecords.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay registros de facturación aún
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Emisión</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha Pago</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billingRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {format(new Date(record.issueDate), "dd MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>{record.description}</TableCell>
                                        <TableCell className="font-medium">
                                            ${record.amount.toLocaleString("es-CL")}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(record.dueDate), "dd MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                        <TableCell>
                                            {record.paidAt
                                                ? format(new Date(record.paidAt), "dd MMM yyyy", { locale: es })
                                                : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
