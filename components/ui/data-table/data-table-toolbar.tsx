"use client"

import { Table } from "@tanstack/react-table"
import { X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

export interface FilterOption {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
}

export interface FilterConfig {
    column: string
    title: string
    options: FilterOption[]
}

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    searchable?: boolean
    searchPlaceholder?: string
    searchColumn?: string
    filters?: FilterConfig[]
    globalFilter: string
    setGlobalFilter: (value: string) => void
}

export function DataTableToolbar<TData>({
    table,
    searchable = true,
    searchPlaceholder = "Buscar...",
    searchColumn,
    filters = [],
    globalFilter,
    setGlobalFilter,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
                {searchable && (
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={
                                searchColumn
                                    ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
                                    : globalFilter
                            }
                            onChange={(event) =>
                                searchColumn
                                    ? table.getColumn(searchColumn)?.setFilterValue(event.target.value)
                                    : setGlobalFilter(event.target.value)
                            }
                            className="pl-8 h-9"
                        />
                    </div>
                )}
                {filters.map((filter) => {
                    const column = table.getColumn(filter.column)
                    if (!column) return null
                    return (
                        <DataTableFacetedFilter
                            key={filter.column}
                            column={column}
                            title={filter.title}
                            options={filter.options}
                        />
                    )
                })}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            table.resetColumnFilters()
                            setGlobalFilter("")
                        }}
                        className="h-9 px-2 lg:px-3"
                    >
                        Limpiar
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} de {table.getCoreRowModel().rows.length} resultados
                </p>
            </div>
        </div>
    )
}
