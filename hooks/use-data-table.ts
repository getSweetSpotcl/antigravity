"use client"

import { useState, useCallback } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

interface UseDataTableOptions<TData, TValue> {
    data: TData[]
    columns: ColumnDef<TData, TValue>[]
    defaultSorting?: SortingState
    defaultPageSize?: number
    enablePagination?: boolean
    enableSorting?: boolean
    enableFiltering?: boolean
}

export function useDataTable<TData, TValue>({
    data,
    columns,
    defaultSorting = [],
    defaultPageSize = 10,
    enablePagination = true,
    enableSorting = true,
    enableFiltering = true,
}: UseDataTableOptions<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>(defaultSorting)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = useState("")

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
        onSortingChange: enableSorting ? setSorting : undefined,
        getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
        onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
        getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: defaultPageSize,
            },
        },
    })

    const resetFilters = useCallback(() => {
        setColumnFilters([])
        setGlobalFilter("")
    }, [])

    const resetAll = useCallback(() => {
        resetFilters()
        setSorting(defaultSorting)
        table.setPageIndex(0)
    }, [resetFilters, defaultSorting, table])

    return {
        table,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        columnVisibility,
        setColumnVisibility,
        globalFilter,
        setGlobalFilter,
        resetFilters,
        resetAll,
    }
}
