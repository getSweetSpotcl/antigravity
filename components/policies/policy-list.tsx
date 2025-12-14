"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from "date-fns"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DataTable, DataTableColumnHeader, FilterConfig } from "@/components/ui/data-table"

interface PolicyListProps {
    policies: any[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    ACTIVE: { label: "Vigente", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    EXPIRED: { label: "Vencida", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
    CANCELLED: { label: "Anulada", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
    RENEWED: { label: "Renovada", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
}

const TYPE_LABELS: Record<string, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automóvil",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

const statusOptions = [
    { label: "Vigente", value: "ACTIVE" },
    { label: "Vencida", value: "EXPIRED" },
    { label: "Anulada", value: "CANCELLED" },
    { label: "Renovada", value: "RENEWED" },
]

const typeOptions = [
    { label: "General", value: "GENERAL" },
    { label: "Vida", value: "LIFE" },
    { label: "Salud", value: "HEALTH" },
    { label: "Automóvil", value: "AUTO" },
    { label: "Hogar", value: "HOME" },
    { label: "Garantía", value: "GUARANTEE" },
]

const getDaysUntilExpiry = (endDate: Date) => {
    return differenceInDays(new Date(endDate), new Date())
}

export const PolicyList = ({ policies }: PolicyListProps) => {
    const router = useRouter()

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            accessorKey: "number",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Número" />
            ),
            cell: ({ row }) => (
                <Link
                    href={`/dashboard/policies/${row.original.id}`}
                    className="hover:underline text-blue-600 font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    {row.original.number}
                </Link>
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => {
                const daysUntilExpiry = getDaysUntilExpiry(row.original.endDate)
                const isExpiringSoon = row.original.status === "ACTIVE" && daysUntilExpiry <= 30 && daysUntilExpiry > 0
                const config = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.ACTIVE
                return (
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`${config.color} border gap-1.5`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                        </Badge>
                        {isExpiringSoon && (
                            <span className="flex items-center text-amber-600" title={`Vence en ${daysUntilExpiry} días`}>
                                <AlertTriangle className="h-4 w-4" />
                            </span>
                        )}
                    </div>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "companyName",
            accessorFn: (row) => row.InsuranceCompany?.name || row.company,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Compañía" />
            ),
            cell: ({ row }) => row.original.InsuranceCompany?.name || row.original.company,
        },
        {
            accessorKey: "type",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Ramo" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline">
                    {TYPE_LABELS[row.original.type] || row.original.type}
                </Badge>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "clientName",
            accessorFn: (row) => `${row.Client.firstName} ${row.Client.lastName}`,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Cliente" />
            ),
            cell: ({ row }) => (
                <div>
                    <span className="font-medium">
                        {row.original.Client.firstName} {row.original.Client.lastName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                        {row.original.Client.rut}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "startDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Vigencia" />
            ),
            cell: ({ row }) => {
                const daysUntilExpiry = getDaysUntilExpiry(row.original.endDate)
                const isExpiringSoon = row.original.status === "ACTIVE" && daysUntilExpiry <= 30 && daysUntilExpiry > 0
                return (
                    <div className="text-sm">
                        <span>{format(new Date(row.original.startDate), "dd/MM/yyyy")}</span>
                        <span className="text-muted-foreground"> - </span>
                        <span className={isExpiringSoon ? "text-amber-600 font-medium" : ""}>
                            {format(new Date(row.original.endDate), "dd/MM/yyyy")}
                        </span>
                    </div>
                )
            },
            sortingFn: (rowA, rowB) => {
                const dateA = new Date(rowA.original.startDate).getTime()
                const dateB = new Date(rowB.original.startDate).getTime()
                return dateA - dateB
            },
        },
        {
            accessorKey: "premium",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Prima" className="text-right" />
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    <span className="font-bold text-teal-700 tabular-nums">
                        {Number(row.original.premium).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground ml-1">{row.original.currency}</span>
                </div>
            ),
            sortingFn: (rowA, rowB) => {
                const a = Number(rowA.original.premium) || 0
                const b = Number(rowB.original.premium) || 0
                return a - b
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
            column: "type",
            title: "Tipo",
            options: typeOptions,
        },
    ], [])

    const handleRowClick = (policy: any) => {
        router.push(`/dashboard/policies/${policy.id}`)
    }

    return (
        <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold tracking-tight">Pólizas</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={policies}
                    searchable={true}
                    searchPlaceholder="Buscar por número, compañía, cliente o RUT..."
                    filters={filters}
                    paginated={true}
                    pageSize={10}
                    emptyMessage="No hay pólizas registradas."
                    onRowClick={handleRowClick}
                />
            </CardContent>
        </Card>
    )
}
