"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Send, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateQuoteStatus, deleteQuote } from "@/actions/quote"
import { POLICY_TYPES_ES } from "@/lib/insurance-constants"

import { Quote, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { DownloadQuoteButton } from "@/components/quotes/pdf/download-button"
import { ViewAttachmentsDialog } from "@/components/shared/view-attachments-dialog"
import { DataTable, DataTableColumnHeader, FilterConfig } from "@/components/ui/data-table"

interface QuoteWithRelations extends Omit<Quote, 'totalPremium' | 'totalInsuredAmount'> {
    Client: Client | null
    Company: InsuranceCompany | null
    Tenant: Tenant
    totalPremium: string
    totalInsuredAmount: string | null
}

interface QuoteListProps {
    quotes: QuoteWithRelations[]
}

const statusConfig = {
    DRAFT: { label: "Borrador", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
    SENT: { label: "Enviada", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    ACCEPTED: { label: "Aceptada", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
}

const statusOptions = [
    { label: "Borrador", value: "DRAFT" },
    { label: "Enviada", value: "SENT" },
    { label: "Aceptada", value: "ACCEPTED" },
    { label: "Rechazada", value: "REJECTED" },
]

const policyTypeOptions = Object.entries(POLICY_TYPES_ES).map(([value, label]) => ({
    label,
    value,
}))

export const QuoteList = ({ quotes }: QuoteListProps) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleStatusChange = (id: string, status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED", e: React.MouseEvent) => {
        e.stopPropagation()
        startTransition(() => {
            updateQuoteStatus(id, status)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }
                    if (data.success) {
                        toast.success(data.success)
                        router.refresh()
                    }
                })
        })
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("¿Estás seguro de eliminar esta cotización?")) return

        startTransition(() => {
            deleteQuote(id)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }
                    if (data.success) {
                        toast.success(data.success)
                        router.refresh()
                    }
                })
        })
    }

    const columns: ColumnDef<QuoteWithRelations>[] = useMemo(() => [
        {
            accessorKey: "clientName",
            accessorFn: (row) => row.Client
                ? `${row.Client.firstName} ${row.Client.lastName}`
                : row.prospectName || "Sin nombre",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Cliente / Prospecto" />
            ),
            cell: ({ row }) => {
                const clientName = row.original.Client
                    ? `${row.original.Client.firstName} ${row.original.Client.lastName}`
                    : row.original.prospectName || "Sin nombre"
                return <span className="font-medium">{clientName}</span>
            },
        },
        {
            accessorKey: "companyName",
            accessorFn: (row) => row.Company?.name || "N/A",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Compañía" />
            ),
            cell: ({ row }) => row.original.Company?.name || "N/A",
        },
        {
            accessorKey: "policyType",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tipo" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal">
                    {POLICY_TYPES_ES[row.original.policyType as keyof typeof POLICY_TYPES_ES] || row.original.policyType}
                </Badge>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "totalPremium",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Prima Total" />
            ),
            cell: ({ row }) => (
                <span className="font-bold text-blue-700 tabular-nums">
                    {parseFloat(row.original.totalPremium || "0").toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    <span className="text-xs font-medium text-muted-foreground ml-1">{row.original.currency}</span>
                </span>
            ),
            sortingFn: (rowA, rowB) => {
                const a = parseFloat(rowA.original.totalPremium || "0")
                const b = parseFloat(rowB.original.totalPremium || "0")
                return a - b
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => {
                const status = row.original.status as keyof typeof statusConfig
                const config = statusConfig[status]
                return (
                    <Badge
                        variant="outline"
                        className={`${config?.color || "bg-gray-100"} border gap-1.5`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${config?.dot}`} />
                        {config?.label || row.original.status}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Fecha" />
            ),
            cell: ({ row }) => (
                <span className="text-slate-500">
                    {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: es })}
                </span>
            ),
            sortingFn: (rowA, rowB) => {
                const dateA = new Date(rowA.original.createdAt).getTime()
                const dateB = new Date(rowB.original.createdAt).getTime()
                return dateA - dateB
            },
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => {
                const quote = row.original
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 flex gap-2">
                                    <DownloadQuoteButton quote={quote as any} />
                                    <ViewAttachmentsDialog
                                        entityId={quote.id}
                                        type="quote"
                                        attachments={(quote as any).attachments || []}
                                    />
                                </div>
                                <DropdownMenuSeparator />
                                {quote.status === "DRAFT" && (
                                    <DropdownMenuItem onClick={(e) => handleStatusChange(quote.id, "SENT", e as any)}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Marcar como Enviada
                                    </DropdownMenuItem>
                                )}
                                {quote.status === "SENT" && (
                                    <>
                                        <DropdownMenuItem onClick={(e) => handleStatusChange(quote.id, "ACCEPTED", e as any)}>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                            Marcar como Aceptada
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleStatusChange(quote.id, "REJECTED", e as any)}>
                                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                            Marcar como Rechazada
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => handleDelete(quote.id, e as any)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
        {
            column: "policyType",
            title: "Tipo",
            options: policyTypeOptions,
        },
    ], [])

    const handleRowClick = (quote: QuoteWithRelations) => {
        router.push(`/dashboard/quotes/${quote.id}`)
    }

    return (
        <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold tracking-tight">Cotizaciones</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={quotes}
                    searchable={true}
                    searchPlaceholder="Buscar por cliente, compañía..."
                    filters={filters}
                    paginated={true}
                    pageSize={10}
                    emptyMessage="No hay cotizaciones registradas."
                    onRowClick={handleRowClick}
                />
            </CardContent>
        </Card>
    )
}
