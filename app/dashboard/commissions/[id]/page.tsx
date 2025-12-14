import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getCommissionById, deleteCommissionPayment } from "@/actions/commission"
import { serializeDecimal } from "@/lib/serialize"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, DollarSign, Trash2 } from "lucide-react"
import Link from "next/link"
import type { CommissionStatus, PaymentMethod } from "@prisma/client"
import { CommissionPaymentActions } from "@/components/commissions/commission-payment-actions"

const STATUS_LABELS: Record<CommissionStatus, string> = {
    PENDING: "Pendiente",
    PARTIAL: "Parcial",
    PAID: "Pagada",
    OVERDUE: "Vencida",
    CANCELLED: "Cancelada",
}

const STATUS_COLORS: Record<CommissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "secondary",
    PARTIAL: "default",
    PAID: "outline",
    OVERDUE: "destructive",
    CANCELLED: "secondary",
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    TRANSFER: "Transferencia",
    CHECK: "Cheque",
    CASH: "Efectivo",
    CREDIT_CARD: "Tarjeta de Crédito",
    OTHER: "Otro",
}

export default async function CommissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const commissionRaw = await getCommissionById(id)

    if (!commissionRaw) {
        notFound()
    }

    const commission = serializeDecimal(commissionRaw)

    const pendingAmount = Number(commission.pendingAmount)
    const paidAmount = Number(commission.paidAmount)
    const totalAmount = Number(commission.amount)
    const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/commissions">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Comisión - Póliza {commission.Policy.number}
                        {commission.installment && (
                            <span className="text-lg font-normal text-muted-foreground ml-2">
                                (Cuota {commission.installment}/{commission.totalInstallments})
                            </span>
                        )}
                    </h2>
                    <p className="text-muted-foreground">
                        {commission.Policy.Client.firstName} {commission.Policy.Client.lastName}
                    </p>
                </div>
                <Badge variant={STATUS_COLORS[commission.status]} className="text-lg px-4 py-2">
                    {STATUS_LABELS[commission.status]}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Monto Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {totalAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {Number(commission.percentage)}% de {Number(commission.baseAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })} {commission.currency}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pagado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                            {paidAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pendiente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-600">
                            {pendingAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </p>
                        {commission.dueDate && (
                            <p className="text-xs text-muted-foreground">
                                Vence: {format(new Date(commission.dueDate), "PPP", { locale: es })}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Comisión</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Póliza</p>
                                <Link
                                    href={`/dashboard/policies/${commission.policyId}`}
                                    className="text-blue-600 hover:underline"
                                >
                                    {commission.Policy.number}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Compañía</p>
                                <p>{commission.Policy.InsuranceCompany?.name || commission.Policy.company}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Porcentaje</p>
                                <p>{Number(commission.percentage)}%</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Moneda</p>
                                <p>{commission.currency}</p>
                            </div>
                        </div>
                        {commission.periodStart && commission.periodEnd && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Período</p>
                                <p>
                                    {format(new Date(commission.periodStart), "dd/MM/yyyy")} -{" "}
                                    {format(new Date(commission.periodEnd), "dd/MM/yyyy")}
                                </p>
                            </div>
                        )}
                        {commission.notes && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Notas</p>
                                <p className="text-sm">{commission.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                            <p className="text-lg">
                                {commission.Policy.Client.firstName} {commission.Policy.Client.lastName}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">RUT</p>
                            <p>{commission.Policy.Client.rut}</p>
                        </div>
                        {commission.Policy.Client.email && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p>{commission.Policy.Client.email}</p>
                            </div>
                        )}
                        {commission.Policy.Client.phone && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                                <p>{commission.Policy.Client.phone}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Historial de Pagos
                    </CardTitle>
                    <CommissionPaymentActions
                        commission={commission}
                        canRegisterPayment={commission.status !== "PAID" && commission.status !== "CANCELLED"}
                    />
                </CardHeader>
                <CardContent>
                    {commission.CommissionPayment.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No hay pagos registrados para esta comisión.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Referencia</TableHead>
                                    <TableHead>Banco</TableHead>
                                    <TableHead>Registrado por</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commission.CommissionPayment.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {Number(payment.amount).toLocaleString("es-CL", {
                                                minimumFractionDigits: 2,
                                            })}{" "}
                                            {payment.currency}
                                        </TableCell>
                                        <TableCell>
                                            {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                                        </TableCell>
                                        <TableCell>{payment.reference || "-"}</TableCell>
                                        <TableCell>{payment.bankName || "-"}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {payment.recordedByName || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <CommissionPaymentActions
                                                paymentId={payment.id}
                                                canDelete={true}
                                            />
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
