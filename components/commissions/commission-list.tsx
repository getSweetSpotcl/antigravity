"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import type { Commission, Policy, Client, InsuranceCompany, CommissionPayment, CommissionStatus } from "@prisma/client"
import { format, differenceInDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, DollarSign, Eye, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RegisterPaymentDialog } from "./register-payment-dialog"
import { cancelCommission } from "@/actions/commission"
import { toast } from "sonner"
import { DataTable, DataTableColumnHeader, FilterConfig } from "@/components/ui/data-table"

type CommissionWithRelations = Commission & {
    Policy: Policy & {
        Client: Client
        InsuranceCompany: InsuranceCompany | null
    }
    CommissionPayment: CommissionPayment[]
}

interface CommissionListProps {
    commissions: CommissionWithRelations[]
}

const STATUS_LABELS: Record<CommissionStatus, string> = {
    PENDING: "Pendiente",
    PARTIAL: "Parcial",
    PAID: "Pagada",
    OVERDUE: "Vencida",
    CANCELLED: "Cancelada",
}

const STATUS_COLORS: Record<CommissionStatus, string> = {
    PENDING: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    PARTIAL: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    OVERDUE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
    CANCELLED: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
}

const statusOptions = [
    { label: "Pendiente", value: "PENDING" },
    { label: "Parcial", value: "PARTIAL" },
    { label: "Pagada", value: "PAID" },
    { label: "Vencida", value: "OVERDUE" },
    { label: "Cancelada", value: "CANCELLED" },
]

export function CommissionList({ commissions }: CommissionListProps) {
    const router = useRouter()
    const [selectedCommission, setSelectedCommission] = useState<CommissionWithRelations | null>(null)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

    const handlePaymentClick = (commission: CommissionWithRelations, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedCommission(commission)
        setPaymentDialogOpen(true)
    }

    const handleCancelCommission = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const result = await cancelCommission(id)
        if (result.success) {
            toast.success(result.success)
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

    const columns: ColumnDef<CommissionWithRelations>[] = useMemo(() => [
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
                        className="hover:underline text-blue-600 font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.original.Policy.number}
                    </Link>
                    {row.original.installment && (
                        <span className="text-xs text-muted-foreground ml-2">
                            ({row.original.installment}/{row.original.totalInstallments})
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "clientName",
            accessorFn: (row) => `${row.Policy.Client.firstName} ${row.Policy.Client.lastName}`,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Cliente" />
            ),
            cell: ({ row }) => (
                <div>
                    <span className="font-medium">
                        {row.original.Policy.Client.firstName} {row.original.Policy.Client.lastName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                        {row.original.Policy.Client.rut}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "companyName",
            accessorFn: (row) => row.Policy.InsuranceCompany?.name || row.Policy.company,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Compañía" />
            ),
            cell: ({ row }) => row.original.Policy.InsuranceCompany?.name || row.original.Policy.company,
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Monto" className="text-right" />
            ),
            cell: ({ row }) => (
                <div className="text-right font-medium">
                    {Number(row.original.amount).toLocaleString("es-CL", { minimumFractionDigits: 2 })} {row.original.currency}
                </div>
            ),
            sortingFn: (rowA, rowB) => {
                const a = Number(rowA.original.amount) || 0
                const b = Number(rowB.original.amount) || 0
                return a - b
            },
        },
        {
            accessorKey: "pendingAmount",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Pendiente" className="text-right" />
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    <span className={Number(row.original.pendingAmount) > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                        {Number(row.original.pendingAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })} {row.original.currency}
                    </span>
                </div>
            ),
            sortingFn: (rowA, rowB) => {
                const a = Number(rowA.original.pendingAmount) || 0
                const b = Number(rowB.original.pendingAmount) || 0
                return a - b
            },
        },
        {
            accessorKey: "dueDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Vencimiento" />
            ),
            cell: ({ row }) => {
                const daysUntilDue = row.original.dueDate
                    ? differenceInDays(new Date(row.original.dueDate), new Date())
                    : null
                const isNearDue =
                    daysUntilDue !== null &&
                    daysUntilDue <= 7 &&
                    daysUntilDue > 0 &&
                    row.original.status !== "PAID" &&
                    row.original.status !== "CANCELLED"

                return row.original.dueDate ? (
                    <div className="flex items-center gap-2">
                        <span className={
                            row.original.status === "OVERDUE"
                                ? "text-red-600"
                                : isNearDue
                                    ? "text-orange-600"
                                    : ""
                        }>
                            {format(new Date(row.original.dueDate), "dd/MM/yyyy")}
                        </span>
                        {isNearDue && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    </div>
                ) : "-"
            },
            sortingFn: (rowA, rowB) => {
                const dateA = rowA.original.dueDate ? new Date(rowA.original.dueDate).getTime() : 0
                const dateB = rowB.original.dueDate ? new Date(rowB.original.dueDate).getTime() : 0
                return dateA - dateB
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => {
                const status = row.original.status as CommissionStatus
                return (
                    <Badge variant="outline" className={`${STATUS_COLORS[status]} border`}>
                        {STATUS_LABELS[status]}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => {
                const commission = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {commission.status !== "PAID" && commission.status !== "CANCELLED" && (
                                <DropdownMenuItem onClick={(e) => handlePaymentClick(commission, e as any)}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Registrar Pago
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/commissions/${commission.id}`} onClick={(e) => e.stopPropagation()}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalle
                                </Link>
                            </DropdownMenuItem>
                            {commission.status === "PENDING" && commission.CommissionPayment.length === 0 && (
                                <DropdownMenuItem
                                    onClick={(e) => handleCancelCommission(commission.id, e as any)}
                                    className="text-red-600"
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
    ], [])

    const filters: FilterConfig[] = useMemo(() => [
        {
            column: "status",
            title: "Estado",
            options: statusOptions,
        },
    ], [])

    const handleRowClick = (commission: CommissionWithRelations) => {
        router.push(`/dashboard/commissions/${commission.id}`)
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Comisiones</CardTitle>
                    {/* Resumen de totales */}
                    <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 dark:bg-slate-800/50 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Comisiones</p>
                            <p className="text-lg font-bold">
                                {totals.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pagado</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {totals.paid.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pendiente</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {totals.pending.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={commissions}
                        searchable={true}
                        searchPlaceholder="Buscar por póliza, cliente o RUT..."
                        filters={filters}
                        paginated={true}
                        pageSize={10}
                        emptyMessage="No hay comisiones registradas."
                        onRowClick={handleRowClick}
                    />
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            {selectedCommission && (
                <RegisterPaymentDialog
                    commission={selectedCommission}
                    open={paymentDialogOpen}
                    onOpenChange={(open) => {
                        setPaymentDialogOpen(open)
                        if (!open) setSelectedCommission(null)
                    }}
                />
            )}
        </>
    )
}
