"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Loader2,
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    LogIn,
    LogOut,
    Download,
    Upload,
    FileText,
    PenLine,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getAuditLogs, getAuditFilterOptions, getAuditStats } from "@/actions/audit"
import type { AuditAction, AuditLog } from "@prisma/client"

const actionIcons: Record<AuditAction, React.ReactNode> = {
    CREATE: <Plus className="h-4 w-4 text-green-600" />,
    UPDATE: <Pencil className="h-4 w-4 text-blue-600" />,
    DELETE: <Trash2 className="h-4 w-4 text-red-600" />,
    LOGIN: <LogIn className="h-4 w-4 text-purple-600" />,
    LOGOUT: <LogOut className="h-4 w-4 text-gray-600" />,
    VIEW: <Eye className="h-4 w-4 text-gray-500" />,
    EXPORT: <Download className="h-4 w-4 text-amber-600" />,
    UPLOAD: <Upload className="h-4 w-4 text-cyan-600" />,
    DOWNLOAD: <Download className="h-4 w-4 text-cyan-600" />,
    SIGN: <PenLine className="h-4 w-4 text-emerald-600" />,
}

const actionLabels: Record<AuditAction, string> = {
    CREATE: "Creación",
    UPDATE: "Actualización",
    DELETE: "Eliminación",
    LOGIN: "Inicio Sesión",
    LOGOUT: "Cierre Sesión",
    VIEW: "Visualización",
    EXPORT: "Exportación",
    UPLOAD: "Subida",
    DOWNLOAD: "Descarga",
    SIGN: "Firma",
}

const actionColors: Record<AuditAction, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    LOGIN: "bg-purple-100 text-purple-800",
    LOGOUT: "bg-gray-100 text-gray-800",
    VIEW: "bg-slate-100 text-slate-800",
    EXPORT: "bg-amber-100 text-amber-800",
    UPLOAD: "bg-cyan-100 text-cyan-800",
    DOWNLOAD: "bg-cyan-100 text-cyan-800",
    SIGN: "bg-emerald-100 text-emerald-800",
}

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isPending, startTransition] = useTransition()

    const [filters, setFilters] = useState({
        action: "",
        entity: "",
        search: "",
    })
    const [filterOptions, setFilterOptions] = useState<{
        entities: string[]
        actions: string[]
    }>({ entities: [], actions: [] })

    const [stats, setStats] = useState<Awaited<ReturnType<typeof getAuditStats>>>(null)
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    // Load filter options on mount
    useEffect(() => {
        async function loadOptions() {
            const options = await getAuditFilterOptions()
            setFilterOptions(options)
        }
        loadOptions()

        async function loadStats() {
            const statsData = await getAuditStats()
            setStats(statsData)
        }
        loadStats()
    }, [])

    // Load logs when page or filters change
    useEffect(() => {
        startTransition(async () => {
            const result = await getAuditLogs({
                page,
                limit: 20,
                action: filters.action as AuditAction | undefined,
                entity: filters.entity || undefined,
                search: filters.search || undefined,
            })
            setLogs(result.logs)
            setTotal(result.total)
            setTotalPages(result.totalPages || 1)
        })
    }, [page, filters])

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
        setPage(1)
    }

    const clearFilters = () => {
        setFilters({ action: "", entity: "", search: "" })
        setPage(1)
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.todayLogs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.weekLogs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.monthLogs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalLogs}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Auditoría</CardTitle>
                    <CardDescription>
                        Historial de acciones realizadas en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={filters.action || "_all"}
                            onValueChange={(value) => handleFilterChange("action", value === "_all" ? "" : value)}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Acción" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">Todas</SelectItem>
                                {filterOptions.actions.map((action) => (
                                    <SelectItem key={action} value={action}>
                                        {actionLabels[action as AuditAction] || action}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.entity || "_all"}
                            onValueChange={(value) => handleFilterChange("entity", value === "_all" ? "" : value)}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Entidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">Todas</SelectItem>
                                {filterOptions.entities.map((entity) => (
                                    <SelectItem key={entity} value={entity}>
                                        {entity}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(filters.action || filters.entity || filters.search) && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="relative">
                        {isPending && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Fecha</TableHead>
                                    <TableHead className="w-[100px]">Acción</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            No se encontraron registros
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm">
                                                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
                                                    locale: es,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={actionColors[log.action]}
                                                >
                                                    <span className="mr-1">
                                                        {actionIcons[log.action]}
                                                    </span>
                                                    {actionLabels[log.action]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.entity}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {log.description || log.entityName || log.entityId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{log.userName || "-"}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {log.userEmail}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedLog(log)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Detalle del Registro</DialogTitle>
                                                            <DialogDescription>
                                                                {format(
                                                                    new Date(log.createdAt),
                                                                    "dd 'de' MMMM 'de' yyyy, HH:mm:ss",
                                                                    { locale: es }
                                                                )}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Acción
                                                                    </p>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={actionColors[log.action]}
                                                                    >
                                                                        {actionLabels[log.action]}
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Entidad
                                                                    </p>
                                                                    <p>{log.entity}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Usuario
                                                                    </p>
                                                                    <p>{log.userName || "-"}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {log.userEmail}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        IP / User Agent
                                                                    </p>
                                                                    <p className="text-sm">{log.ipAddress || "-"}</p>
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                        {log.userAgent}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {log.description && (
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Descripción
                                                                    </p>
                                                                    <p>{log.description}</p>
                                                                </div>
                                                            )}
                                                            {log.oldValues && (
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                                                        Valores Anteriores
                                                                    </p>
                                                                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                                                                        {JSON.stringify(log.oldValues, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {log.newValues && (
                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                                                        Valores Nuevos
                                                                    </p>
                                                                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                                                                        {JSON.stringify(log.newValues, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {(page - 1) * 20 + 1} -{" "}
                                {Math.min(page * 20, total)} de {total} registros
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || isPending}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">
                                    Página {page} de {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isPending}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
