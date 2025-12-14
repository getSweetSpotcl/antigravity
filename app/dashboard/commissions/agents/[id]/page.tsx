import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getAgentCommissionById } from "@/actions/agent-commission"
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
import { ArrowLeft, DollarSign, User, Building2, FileText } from "lucide-react"
import Link from "next/link"
import type { CommissionStatus, PaymentMethod } from "@prisma/client"
import { AgentCommissionPaymentActions } from "@/components/commissions/agent-commission-payment-actions"

const STATUS_LABELS: Record<CommissionStatus, string> = {
    PENDING: "Pendiente",
    PARTIAL: "Parcial",
    PAID: "Pagada",
    OVERDUE: "Vencida",
    CANCELLED: "Cancelada",
}

const STATUS_COLORS: Record<CommissionStatus, string> = {
    PENDING: "bg-slate-100 text-slate-700 border-slate-200",
    PARTIAL: "bg-blue-100 text-blue-700 border-blue-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    OVERDUE: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    TRANSFER: "Transferencia",
    CHECK: "Cheque",
    CASH: "Efectivo",
    CREDIT_CARD: "Tarjeta de Crédito",
    OTHER: "Otro",
}

export default async function AgentCommissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const commissionRaw = await getAgentCommissionById(id)

    if (!commissionRaw) {
        notFound()
    }

    const commission = serializeDecimal(commissionRaw)

    const pendingAmount = Number(commission.pendingAmount)
    const paidAmount = Number(commission.paidAmount)
    const totalAmount = Number(commission.amount)
    const baseAmount = Number(commission.baseAmount)
    const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/commissions/agents">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <User className="h-6 w-6 text-sky-600" />
                            Comisión de Vendedor
                        </h1>
                        <p className="text-slate-500">
                            {commission.Agent.name || commission.Agent.email} - Póliza {commission.Policy.number}
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className={`text-sm px-3 py-1 ${STATUS_COLORS[commission.status]}`}>
                    {STATUS_LABELS[commission.status]}
                </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Monto Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">
                            {totalAmount.toFixed(2)} {commission.currency}
                        </p>
                        <p className="text-sm text-slate-500">
                            {Number(commission.percentage)}% de {baseAmount.toFixed(2)} {commission.currency}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Pagado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-emerald-600">
                            {paidAmount.toFixed(2)} {commission.currency}
                        </p>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Pendiente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-amber-600">
                            {pendingAmount.toFixed(2)} {commission.currency}
                        </p>
                        {commission.dueDate && (
                            <p className="text-sm text-slate-500">
                                Vence: {format(new Date(commission.dueDate), "dd/MM/yyyy")}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Comisión Corredora
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-700">
                            {baseAmount.toFixed(2)} {commission.currency}
                        </p>
                        <Link
                            href={`/dashboard/commissions/${commission.commissionId}`}
                            className="text-sm text-sky-600 hover:underline"
                        >
                            Ver comisión corredora
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Agent Info */}
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-sky-600" />
                            Información del Vendedor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Nombre</p>
                                <p className="font-medium">{commission.Agent.name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Email</p>
                                <p>{commission.Agent.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">% Comisión</p>
                                <p className="font-medium">{Number(commission.percentage)}%</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">% Por defecto</p>
                                <p>{commission.Agent.defaultCommissionPercentage ? `${Number(commission.Agent.defaultCommissionPercentage)}%` : "-"}</p>
                            </div>
                        </div>
                        {(commission.Agent.bankName || commission.Agent.bankAccountNumber) && (
                            <div className="pt-2 border-t">
                                <p className="text-sm font-medium text-slate-500 mb-2">Datos Bancarios</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Banco</p>
                                        <p>{commission.Agent.bankName || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">N° Cuenta</p>
                                        <p>{commission.Agent.bankAccountNumber || "-"}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Policy Info */}
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-sky-600" />
                            Información de la Póliza
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Póliza</p>
                                <Link
                                    href={`/dashboard/policies/${commission.policyId}`}
                                    className="font-medium text-sky-600 hover:underline"
                                >
                                    {commission.Policy.number}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Compañía</p>
                                <p>{commission.Policy.InsuranceCompany?.name || commission.Policy.company || "-"}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Cliente</p>
                            <p className="font-medium">
                                {commission.Policy.Client.firstName} {commission.Policy.Client.lastName}
                            </p>
                            <p className="text-sm text-slate-500">{commission.Policy.Client.rut}</p>
                        </div>
                        {commission.notes && (
                            <div className="pt-2 border-t">
                                <p className="text-sm font-medium text-slate-500">Notas</p>
                                <p className="text-sm">{commission.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment History */}
            <Card className="bg-white border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Historial de Pagos al Vendedor
                    </CardTitle>
                    <AgentCommissionPaymentActions
                        commission={{
                            id: commission.id,
                            agentId: commission.agentId,
                            amount: Number(commission.amount),
                            pendingAmount: Number(commission.pendingAmount),
                            currency: commission.currency,
                            status: commission.status,
                            Agent: commission.Agent,
                            Policy: {
                                number: commission.Policy.number,
                                Client: {
                                    firstName: commission.Policy.Client.firstName,
                                    lastName: commission.Policy.Client.lastName,
                                },
                            },
                        }}
                        canRegisterPayment={commission.status !== "PAID" && commission.status !== "CANCELLED"}
                    />
                </CardHeader>
                <CardContent>
                    {commission.AgentCommissionPayment.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">
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
                                {commission.AgentCommissionPayment.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {Number(payment.amount).toFixed(2)} {payment.currency}
                                        </TableCell>
                                        <TableCell>
                                            {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethod]}
                                        </TableCell>
                                        <TableCell>{payment.reference || "-"}</TableCell>
                                        <TableCell>{payment.bankName || "-"}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {payment.recordedByName || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <AgentCommissionPaymentActions
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
