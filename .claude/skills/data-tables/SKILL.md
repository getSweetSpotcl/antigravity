---
name: data-tables
description: Patrón para crear listas y tablas de datos con DataTable de TanStack. Usar al crear páginas de listado de entidades.
---

# Skill: Data Tables

Este skill define el patrón estándar para crear listas de datos en GiCS usando el componente DataTable basado en TanStack Table.

## Estructura Base de una Lista

```typescript
"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DataTable, DataTableColumnHeader, FilterConfig } from "@/components/ui/data-table"

interface EntityListProps {
    entities: EntityType[]
}

// Configuración de estados con colores semánticos
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    ACTIVE: {
        label: "Activo",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500"
    },
    PENDING: {
        label: "Pendiente",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500"
    },
    // ...más estados
}

const statusOptions = [
    { label: "Activo", value: "ACTIVE" },
    { label: "Pendiente", value: "PENDING" },
    // ...más opciones
]

export function EntityList({ entities }: EntityListProps) {
    const router = useRouter()

    const columns: ColumnDef<EntityType>[] = useMemo(() => [
        // Definición de columnas
    ], [])

    const filters: FilterConfig[] = useMemo(() => [
        {
            column: "status",
            title: "Estado",
            options: statusOptions,
        },
    ], [])

    const handleRowClick = (entity: EntityType) => {
        router.push(`/dashboard/entities/${entity.id}`)
    }

    return (
        <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold tracking-tight">
                    Entidades
                </CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={entities}
                    searchable={true}
                    searchPlaceholder="Buscar..."
                    filters={filters}
                    paginated={true}
                    pageSize={10}
                    emptyMessage="No hay entidades registradas."
                    onRowClick={handleRowClick}
                />
            </CardContent>
        </Card>
    )
}
```

## Tipos de Columnas

### Columna con Link

```tsx
{
    accessorKey: "number",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Número" />
    ),
    cell: ({ row }) => (
        <Link
            href={`/dashboard/entities/${row.original.id}`}
            className="hover:underline text-blue-600 font-medium"
            onClick={(e) => e.stopPropagation()}
        >
            {row.original.number}
        </Link>
    ),
}
```

### Columna con Badge de Estado

```tsx
{
    accessorKey: "status",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
        const status = row.original.status
        const config = statusConfig[status]
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
}
```

### Columna con Valor Calculado (accessorFn)

```tsx
{
    accessorKey: "clientName",
    accessorFn: (row) => `${row.client.firstName} ${row.client.lastName}`,
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => (
        <span className="font-medium">
            {row.original.client.firstName} {row.original.client.lastName}
        </span>
    ),
}
```

### Columna de Fecha

```tsx
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
}
```

### Columna de Monto Financiero

```tsx
{
    accessorKey: "premium",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Prima" className="text-right" />
    ),
    cell: ({ row }) => (
        <div className="text-right">
            <span className="font-bold text-teal-700 tabular-nums">
                {Number(row.original.premium).toLocaleString("es-CL", {
                    minimumFractionDigits: 2
                })}
            </span>
            <span className="text-xs font-medium text-muted-foreground ml-1">
                {row.original.currency}
            </span>
        </div>
    ),
    sortingFn: (rowA, rowB) => {
        const a = Number(rowA.original.premium) || 0
        const b = Number(rowB.original.premium) || 0
        return a - b
    },
}
```

### Columna con Relación Anidada

```tsx
{
    accessorKey: "companyName",
    accessorFn: (row) => row.insuranceCompany?.name || row.company || "",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Compañía" />
    ),
    cell: ({ row }) => row.original.insuranceCompany?.name || row.original.company,
}
```

### Columna con Información Múltiple

```tsx
{
    accessorKey: "clientInfo",
    accessorFn: (row) => `${row.client.firstName} ${row.client.lastName}`,
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => (
        <div>
            <span className="font-medium">
                {row.original.client.firstName} {row.original.client.lastName}
            </span>
            <span className="block text-xs text-muted-foreground">
                {row.original.client.rut}
            </span>
        </div>
    ),
}
```

### Columna de Acciones (Dropdown)

```tsx
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Pencil, Eye } from "lucide-react"

{
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
        const entity = row.original
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
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/entities/${entity.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(entity.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleDelete(entity.id)}
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
}
```

## Colores Semánticos para Estados

### Estados de Póliza

```typescript
const policyStatusConfig = {
    ACTIVE: { label: "Vigente", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    EXPIRED: { label: "Vencida", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
    CANCELLED: { label: "Anulada", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
    RENEWED: { label: "Renovada", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
}
```

### Estados de Cotización

```typescript
const quoteStatusConfig = {
    DRAFT: { label: "Borrador", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
    SENT: { label: "Enviada", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    ACCEPTED: { label: "Aceptada", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    REJECTED: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
}
```

### Estados de Siniestro

```typescript
const claimStatusConfig = {
    REPORTED: { label: "Reportado", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    IN_PROCESS: { label: "En Proceso", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500 status-pulse" },
    APPROVED: { label: "Aprobado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
    CLOSED: { label: "Cerrado", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
}
```

### Estados de Comisión

```typescript
const commissionStatusConfig = {
    PENDING: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    PARTIAL: { label: "Parcial", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    PAID: { label: "Pagada", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    OVERDUE: { label: "Vencida", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
    CANCELLED: { label: "Cancelada", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
}
```

## Props del DataTable

```typescript
interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]  // Definición de columnas
    data: TData[]                          // Datos a mostrar
    searchable?: boolean                   // Habilitar búsqueda global
    searchPlaceholder?: string             // Placeholder del buscador
    searchColumn?: string                  // Columna específica para buscar
    filters?: FilterConfig[]               // Filtros facetados
    paginated?: boolean                    // Habilitar paginación
    pageSize?: number                      // Filas por página (default: 10)
    emptyMessage?: string                  // Mensaje cuando no hay datos
    loading?: boolean                      // Estado de carga
    onRowClick?: (row: TData) => void      // Callback al clickear fila
}

interface FilterConfig {
    column: string
    title: string
    options: { label: string; value: string }[]
}
```

## Filtros Facetados

```typescript
const filters: FilterConfig[] = useMemo(() => [
    {
        column: "status",
        title: "Estado",
        options: [
            { label: "Vigente", value: "ACTIVE" },
            { label: "Vencida", value: "EXPIRED" },
        ],
    },
    {
        column: "type",
        title: "Tipo",
        options: [
            { label: "General", value: "GENERAL" },
            { label: "Vida", value: "LIFE" },
        ],
    },
], [])
```

## Archivos de Referencia

- `components/policies/policy-list.tsx` - Lista de pólizas
- `components/quotes/quote-list.tsx` - Lista con acciones
- `components/claims/claim-list.tsx` - Lista de siniestros
- `components/ui/data-table/` - Componentes base del DataTable
