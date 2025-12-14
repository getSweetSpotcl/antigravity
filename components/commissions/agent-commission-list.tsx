"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import type { CommissionStatus } from "@prisma/client"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, DollarSign, Eye, XCircle, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RegisterAgentPaymentDialog } from "./register-agent-payment-dialog"
import { cancelAgentCommission } from "@/actions/agent-commission"
import { toast } from "sonner"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import type { FilterConfig } from "@/components/ui/data-table/data-table-toolbar"

interface AgentCommissionWithRelations {
    id: string
    commissionId: string
    policyId: string
    agentId: string
    percentage: number | string
    baseAmount: number | string
    amount: number | string
    currency: string
    status: CommissionStatus
    paidAmount: number | string
    pendingAmount: number | string
    dueDate: Date | null
    paidDate: Date | null
    notes: string | null
    tenantId: string
    createdAt: Date
    updatedAt: Date
    Policy: {
        id: string
        number: string
        Client: {
            firstName: string
            lastName: string
        }
        InsuranceCompany: {
            name: string
        } | null
    }
    Agent: {
        id: string
        name: string | null
        email: string
    }
    Commission: {
        id: string
        amount: number | string
        status: CommissionStatus
        paidAmount: number | string
    }
    AgentCommissionPayment: {
        id: string
        amount: number | string
        paymentDate: Date
    }[]
}

interface AgentCommissionListProps {
    commissions: AgentCommissionWithRelations[]
}

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

const statusOptions = [
    { label: "Pendiente", value: "PENDING" },
    { label: "Parcial", value: "PARTIAL" },
    { label: "Pagada", value: "PAID" },
    { label: "Vencida", value: "OVERDUE" },
    { label: "Cancelada", value: "CANCELLED" },
]

export function AgentCommissionList({ commissions }: AgentCommissionListProps) {
    const router = useRouter()
    const [selectedCommission, setSelectedCommission] = useState<AgentCommissionWithRelations | null>(null)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

    const handlePaymentClick = (commission: AgentCommissionWithRelations, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedCommission(commission)
        setPaymentDialogOpen(true)
    }

    const handleCancelCommission = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const result = await cancelAgentCommission(id)
        if (result.success) {
            toast.success(result.success)
            router.refresh()
        } else {
            toast.error(result.error || "Error al cancelar")
        }
    }

    // Calcular totales
    const totals = useMemo(() => {
        const filtered = commissions.filter((c) => c.status !== "CANCELLED")
        return {
            amount: filtered.reduce((sum, c) => sum + Number(c.amount), 0),
            paid: filtered.reduce((sum, c) => sum + Number(c.paidAmount), 0),
            pending: filtered.reduce((sum, c) => sum + Number(c.pendingAmount), 0),
        }
    }, [commissions])

    const columns: ColumnDef<AgentCommissionWithRelations>[] = useMemo(() => [
        {
            accessorKey: "agentName",
            accessorFn: (row) => row.Agent.name || row.Agent.email,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Vendedor" />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">
                        {row.original.Agent.name || row.original.Agent.email}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "policyNumber",
            accessorFn: (row) => row.Policy.number,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Póliza" />
            ),
            cell: ({ row }) => (
                <div>
                    <Link
                        href={`/dashboard/policies/${row.original.policyId}`}
                        className="font-medium text-sky-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.original.Policy.number}
                    </Link>
                    <p className="text-sm text-slate-500">
                        {row.original.Policy.Client.firstName} {row.original.Policy.Client.lastName}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "percentage",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="% Comisión" />
            ),
            cell: ({ row }) => (
                <span className="font-medium">
                    {Number(row.original.percentage)}%
                </span>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Monto" />
            ),
            cell: ({ row }) => (
                <span className="font-medium">
                    {Number(row.original.amount).toFixed(2)} {row.original.currency}
                </span>
            ),
        },
        {
            accessorKey: "pendingAmount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Pendiente" />
            ),
            cell: ({ row }) => {
                const pending = Number(row.original.pendingAmount)
                return (
                    <span className={pending > 0 ? "text-amber-600 font-medium" : "text-emerald-600"}>
                        {pending.toFixed(2)} {row.original.currency}
                    </span>
                )
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className={STATUS_COLORS[row.original.status]}>
                    {STATUS_LABELS[row.original.status]}
                </Badge>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "dueDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Vencimiento" />
            ),
            cell: ({ row }) => row.original.dueDate
                ? format(new Date(row.original.dueDate), "dd/MM/yyyy")
                : "-",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const commission = row.original
                const canPay = commission.status !== "PAID" && commission.status !== "CANCELLED"
                const canCancel = commission.status === "PENDING" && commission.AgentCommissionPayment.length === 0

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/commissions/agents/${commission.id}`)
                            }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                            </DropdownMenuItem>
                            {canPay && (
                                <DropdownMenuItem onClick={(e) => handlePaymentClick(commission, e)}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Registrar pago
                                </DropdownMenuItem>
                            )}
                            {canCancel && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => handleCancelCommission(commission.id, e)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [router])

    const filterConfig: FilterConfig[] = [
        {
            column: "status",
            title: "Estado",
            options: statusOptions,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Total Comisiones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {totals.amount.toFixed(2)} UF
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            Pagado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {totals.paid.toFixed(2)} UF
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
                        <div className="text-2xl font-bold text-amber-600">
                            {totals.pending.toFixed(2)} UF
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                    <DataTable
                        columns={columns}
                        data={commissions}
                        searchColumn="agentName"
                        searchPlaceholder="Buscar por vendedor..."
                        filters={filterConfig}
                        onRowClick={(row) => router.push(`/dashboard/commissions/agents/${row.id}`)}
                    />
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            {selectedCommission && (
                <RegisterAgentPaymentDialog
                    commission={selectedCommission}
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                />
            )}
        </div>
    )
}
