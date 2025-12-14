"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { exportToExcel, exportToCSV, type ExportColumn } from "@/lib/export"
import { toast } from "sonner"

interface ExportButtonProps {
    data: Record<string, unknown>[]
    columns: ExportColumn[]
    filename: string
    sheetName?: string
    disabled?: boolean
    variant?: "default" | "outline" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
    onExportStart?: () => void
    onExportComplete?: (format: "excel" | "csv") => void
    onExportError?: (error: Error) => void
    enablePDF?: boolean
    onPDFExport?: () => void
}

export function ExportButton({
    data,
    columns,
    filename,
    sheetName = "Datos",
    disabled = false,
    variant = "outline",
    size = "default",
    className,
    onExportStart,
    onExportComplete,
    onExportError,
    enablePDF = false,
    onPDFExport,
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async (format: "excel" | "csv" | "pdf") => {
        if (data.length === 0) {
            toast.warning("No hay datos para exportar")
            return
        }

        setIsExporting(true)
        onExportStart?.()

        try {
            if (format === "excel") {
                exportToExcel({
                    filename,
                    sheetName,
                    columns,
                    data,
                })
                toast.success("Archivo Excel exportado correctamente")
            } else if (format === "csv") {
                exportToCSV({
                    filename,
                    columns,
                    data,
                })
                toast.success("Archivo CSV exportado correctamente")
            } else if (format === "pdf") {
                if (onPDFExport) {
                    onPDFExport()
                } else {
                    toast.info("Exportación a PDF próximamente")
                }
            }

            if (format !== "pdf") {
                onExportComplete?.(format)
            }
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Error al exportar los datos")
            onExportError?.(error as Error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled || isExporting || data.length === 0}
                    className={className}
                >
                    {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar a Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar a CSV
                </DropdownMenuItem>
                {enablePDF && (
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar a PDF
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
