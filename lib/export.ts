import * as XLSX from "xlsx"

export interface ExportColumn<T = Record<string, unknown>> {
    key: keyof T | string
    header: string
    width?: number
    formatter?: (value: unknown) => string | number
}

export interface ExportOptions<T = Record<string, unknown>> {
    filename: string
    sheetName?: string
    columns: ExportColumn[]
    data: Record<string, unknown>[]
}

// Export to Excel (.xlsx)
export function exportToExcel({ filename, sheetName = "Datos", columns, data }: ExportOptions): void {
    // Format data according to columns
    const formattedData = data.map((row) => {
        const formattedRow: Record<string, unknown> = {}
        columns.forEach((col) => {
            const value = row[col.key]
            formattedRow[col.header] = col.formatter ? col.formatter(value) : value
        })
        return formattedRow
    })

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(formattedData)

    // Set column widths
    const colWidths = columns.map((col) => ({
        wch: col.width || Math.max(col.header.length + 2, 15),
    }))
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generate and download
    XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Export to CSV
export function exportToCSV({ filename, columns, data }: ExportOptions): void {
    const headers = columns.map((col) => col.header)
    const rows = data.map((row) =>
        columns.map((col) => {
            const value = row[col.key]
            const formatted = col.formatter ? col.formatter(value) : value
            // Escape quotes and wrap in quotes if contains comma
            const str = String(formatted ?? "")
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`
            }
            return str
        })
    )

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

// Common formatters
export const formatters = {
    currency: (value: unknown, currency = "UF") => {
        const num = Number(value)
        if (isNaN(num)) return "-"
        return `${num.toLocaleString("es-CL", { minimumFractionDigits: 2 })} ${currency}`
    },

    date: (value: unknown) => {
        if (!value) return "-"
        try {
            const date = new Date(value as string | number | Date)
            return date.toLocaleDateString("es-CL")
        } catch {
            return "-"
        }
    },

    dateTime: (value: unknown) => {
        if (!value) return "-"
        try {
            const date = new Date(value as string | number | Date)
            return `${date.toLocaleDateString("es-CL")} ${date.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
            })}`
        } catch {
            return "-"
        }
    },

    percentage: (value: unknown) => {
        const num = Number(value)
        if (isNaN(num)) return "-"
        return `${num.toFixed(2)}%`
    },

    number: (value: unknown) => {
        const num = Number(value)
        if (isNaN(num)) return "-"
        return num.toLocaleString("es-CL")
    },

    boolean: (value: unknown) => (value ? "Sí" : "No"),

    status: (statusMap: Record<string, string>) => (value: unknown) =>
        statusMap[String(value)] || String(value),
}

// Pre-defined export configurations for common reports
export const reportExportConfigs = {
    policies: [
        { key: "number", header: "N° Póliza", width: 15 },
        { key: "clientName", header: "Cliente", width: 25 },
        { key: "clientRut", header: "RUT", width: 15 },
        { key: "company", header: "Compañía", width: 20 },
        { key: "type", header: "Ramo", width: 12 },
        { key: "premium", header: "Prima", width: 15, formatter: formatters.currency },
        { key: "commission", header: "Comisión", width: 15, formatter: formatters.currency },
        { key: "currency", header: "Moneda", width: 8 },
        { key: "startDate", header: "Inicio", width: 12, formatter: formatters.date },
        { key: "endDate", header: "Término", width: 12, formatter: formatters.date },
        { key: "status", header: "Estado", width: 12 },
    ],

    claims: [
        { key: "number", header: "N° Siniestro", width: 15 },
        { key: "policyNumber", header: "N° Póliza", width: 15 },
        { key: "clientName", header: "Cliente", width: 25 },
        { key: "company", header: "Compañía", width: 20 },
        { key: "policyType", header: "Ramo", width: 12 },
        { key: "date", header: "Fecha Siniestro", width: 15, formatter: formatters.date },
        { key: "claimAmount", header: "Monto Reclamado", width: 18, formatter: formatters.currency },
        { key: "approvedAmount", header: "Monto Aprobado", width: 18, formatter: formatters.currency },
        { key: "paidAmount", header: "Monto Pagado", width: 18, formatter: formatters.currency },
        { key: "status", header: "Estado", width: 12 },
    ],

    commissions: [
        { key: "policyNumber", header: "N° Póliza", width: 15 },
        { key: "clientName", header: "Cliente", width: 25 },
        { key: "company", header: "Compañía", width: 20 },
        { key: "amount", header: "Comisión Total", width: 18, formatter: formatters.currency },
        { key: "paidAmount", header: "Pagado", width: 18, formatter: formatters.currency },
        { key: "pendingAmount", header: "Pendiente", width: 18, formatter: formatters.currency },
        { key: "status", header: "Estado", width: 12 },
        { key: "dueDate", header: "Vencimiento", width: 15, formatter: formatters.date },
    ],

    auditLogs: [
        { key: "createdAt", header: "Fecha", width: 18, formatter: formatters.dateTime },
        { key: "action", header: "Acción", width: 15 },
        { key: "entity", header: "Entidad", width: 15 },
        { key: "description", header: "Descripción", width: 40 },
        { key: "userName", header: "Usuario", width: 20 },
        { key: "userEmail", header: "Email", width: 25 },
        { key: "ipAddress", header: "IP", width: 15 },
    ],
}
