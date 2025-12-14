"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import type { ClaimStatus } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DataTable, DataTableColumnHeader, FilterConfig } from "@/components/ui/data-table"

interface ClaimListProps {
    claims: any[]
}

const statusConfig: Record<ClaimStatus, { label: string; color: string; dot: string }> = {
    REPORTED: { label: "Reportado", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800", dot: "bg-amber-500" },
    IN_PROCESS: { label: "En Proceso", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800", dot: "bg-blue-500 status-pulse" },
    APPROVED: { label: "Aprobado", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
    REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800", dot: "bg-red-500" },
    CLOSED: { label: "Cerrado", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", dot: "bg-slate-400" },
}

const statusOptions = [
    { label: "Reportado", value: "REPORTED" },
    { label: "En Proceso", value: "IN_PROCESS" },
    { label: "Aprobado", value: "APPROVED" },
    { label: "Rechazado", value: "REJECTED" },
    { label: "Cerrado", value: "CLOSED" },
]

export function ClaimList({ claims }: ClaimListProps) {
    const router = useRouter()

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            accessorKey: "number",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Número" />
            ),
            cell: ({ row }) => (
                <Link
                    href={`/dashboard/claims/${row.original.id}`}
                    className="hover:underline text-blue-600 font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    {row.original.number || "-"}
                </Link>
            ),
        },
        {
            accessorKey: "policyNumber",
            accessorFn: (row) => row.Policy?.number || "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Póliza" />
            ),
            cell: ({ row }) => (
                <Link
                    href={`/dashboard/policies/${row.original.policyId}`}
                    className="hover:underline text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                >
                    {row.original.Policy?.number}
                </Link>
            ),
        },
        {
            accessorKey: "clientName",
            accessorFn: (row) => row.Policy?.Client ? `${row.Policy.Client.firstName} ${row.Policy.Client.lastName}` : "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Cliente" />
            ),
            cell: ({ row }) => (
                <span>
                    {row.original.Policy?.Client?.firstName} {row.original.Policy?.Client?.lastName}
                </span>
            ),
        },
        {
            accessorKey: "companyName",
            accessorFn: (row) => row.Policy?.InsuranceCompany?.name || row.Policy?.company || "",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Compañía" />
            ),
            cell: ({ row }) => row.original.Policy?.InsuranceCompany?.name || row.original.Policy?.company,
        },
        {
            accessorKey: "date",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Fecha Siniestro" />
            ),
            cell: ({ row }) => format(new Date(row.original.date), "PPP", { locale: es }),
            sortingFn: (rowA, rowB) => {
                const dateA = new Date(rowA.original.date).getTime()
                const dateB = new Date(rowB.original.date).getTime()
                return dateA - dateB
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => {
                const status = row.original.status as ClaimStatus
                const config = statusConfig[status] || statusConfig.REPORTED
                return (
                    <Badge
                        variant="outline"
                        className={`${config.color} border gap-1.5`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Descripción" />
            ),
            cell: ({ row }) => (
                <span className="max-w-xs truncate block">
                    {row.original.description}
                </span>
            ),
        },
    ], [])

    const filters: FilterConfig[] = useMemo(() => [
        {
            column: "status",
            title: "Estado",
            options: statusOptions,
        },
    ], [])

    const handleRowClick = (claim: any) => {
        router.push(`/dashboard/claims/${claim.id}`)
    }

    return (
        <Card className="border-slate-200/80 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold tracking-tight">Siniestros</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={claims}
                    searchable={true}
                    searchPlaceholder="Buscar por número, cliente, póliza..."
                    filters={filters}
                    paginated={true}
                    pageSize={10}
                    emptyMessage="No hay siniestros reportados."
                    onRowClick={handleRowClick}
                />
            </CardContent>
        </Card>
    )
}
