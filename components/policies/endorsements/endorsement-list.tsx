"use client"

import { useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Endorsement } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { deleteEndorsement } from "@/actions/endorsement"
import { toast } from "sonner"
import { EditEndorsementDialog } from "./edit-endorsement-dialog"
import { DataTable, DataTableColumnHeader, FilterConfig } from "@/components/ui/data-table"

interface EndorsementListProps {
    endorsements: Endorsement[]
    policyId: string
}

const TYPE_LABELS: Record<string, string> = {
    GENERAL_MODIFICATION: "Modificación",
    RENEWAL: "Renovación",
    CANCELLATION: "Cancelación",
    INCLUSION: "Inclusión",
    EXCLUSION: "Exclusión",
}

const TYPE_COLORS: Record<string, string> = {
    RENEWAL: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    CANCELLATION: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
    INCLUSION: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    EXCLUSION: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    GENERAL_MODIFICATION: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
}

const typeOptions = [
    { label: "Modificación", value: "GENERAL_MODIFICATION" },
    { label: "Renovación", value: "RENEWAL" },
    { label: "Cancelación", value: "CANCELLATION" },
    { label: "Inclusión", value: "INCLUSION" },
    { label: "Exclusión", value: "EXCLUSION" },
]

export function EndorsementList({ endorsements, policyId }: EndorsementListProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedEndorsement, setSelectedEndorsement] = useState<Endorsement | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteClick = (endorsement: Endorsement, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedEndorsement(endorsement)
        setDeleteDialogOpen(true)
    }

    const handleEditClick = (endorsement: Endorsement, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedEndorsement(endorsement)
        setEditDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!selectedEndorsement) return

        setIsDeleting(true)
        try {
            const result = await deleteEndorsement(selectedEndorsement.id)
            if (result.success) {
                toast.success(result.success)
            } else {
                toast.error(result.error || "Error al eliminar el endoso")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setSelectedEndorsement(null)
        }
    }

    const columns: ColumnDef<Endorsement>[] = useMemo(() => [
        {
            accessorKey: "date",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Fecha" />
            ),
            cell: ({ row }) => format(new Date(row.original.date), "PPP", { locale: es }),
            sortingFn: (rowA, rowB) => {
                const dateA = new Date(rowA.original.date).getTime()
                const dateB = new Date(rowB.original.date).getTime()
                return dateA - dateB
            },
        },
        {
            accessorKey: "type",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tipo" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className={`${TYPE_COLORS[row.original.type] || "bg-slate-100"} border`}>
                    {TYPE_LABELS[row.original.type] || row.original.type}
                </Badge>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "number",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Número" />
            ),
            cell: ({ row }) => row.original.number || "-",
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Descripción" />
            ),
            cell: ({ row }) => (
                <span className="max-w-[300px] truncate block">
                    {row.original.description}
                </span>
            ),
        },
        {
            accessorKey: "premiumChange",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Cambio Prima" className="text-right" />
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    {row.original.premiumChange ? (
                        <span className={Number(row.original.premiumChange) >= 0 ? "text-green-600" : "text-red-600"}>
                            {Number(row.original.premiumChange) >= 0 ? "+" : ""}
                            {Number(row.original.premiumChange).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                        </span>
                    ) : "-"}
                </div>
            ),
            sortingFn: (rowA, rowB) => {
                const a = Number(rowA.original.premiumChange) || 0
                const b = Number(rowB.original.premiumChange) || 0
                return a - b
            },
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => {
                const endorsement = row.original
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
                                <span className="sr-only">Acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditClick(endorsement, e as any)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => handleDeleteClick(endorsement, e as any)}
                                className="text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    const filters: FilterConfig[] = useMemo(() => [
        {
            column: "type",
            title: "Tipo",
            options: typeOptions,
        },
    ], [])

    return (
        <>
            <DataTable
                columns={columns}
                data={endorsements}
                searchable={true}
                searchPlaceholder="Buscar por número, descripción..."
                filters={filters}
                paginated={endorsements.length > 10}
                pageSize={10}
                emptyMessage="No hay endosos registrados."
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Endoso</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este endoso? Esta acción no se puede deshacer.
                            {selectedEndorsement?.premiumChange && (
                                <span className="block mt-2 text-amber-600">
                                    Nota: El cambio de prima asociado será revertido en la póliza.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            {selectedEndorsement && (
                <EditEndorsementDialog
                    endorsement={selectedEndorsement}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open)
                        if (!open) setSelectedEndorsement(null)
                    }}
                />
            )}
        </>
    )
}
