"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileDown } from "lucide-react"
import { generateFecuReport, FecuRow } from "@/actions/fecu"
import { toast } from "sonner"

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function FecuReportDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [month, setMonth] = useState<string>(new Date().getMonth().toString())
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

    const convertToCSV = (data: FecuRow[]) => {
        const headers = [
            "RUT Corredor",
            "RUT Compañía",
            "Nro Póliza",
            "RUT Asegurado",
            "Nombre Asegurado",
            "Ramo",
            "Inicio Vigencia",
            "Fin Vigencia",
            "Moneda",
            "Prima Neta",
            "Comisión",
            "Tipo Movimiento"
        ]

        const rows = data.map(row => [
            row.rutCorredor,
            row.rutCompania,
            row.nroPoliza,
            row.rutAsegurado,
            row.nombreAsegurado,
            row.ramo,
            row.inicioVigencia,
            row.finVigencia,
            row.moneda,
            row.primaNeta,
            row.comision,
            row.tipoMovimiento
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n")

        return csvContent
    }

    const handleDownload = async () => {
        setIsPending(true)
        try {
            const data = await generateFecuReport(parseInt(month), parseInt(year))

            if (data.length === 0) {
                toast.warning("No hay datos para el período seleccionado")
                setIsPending(false)
                return
            }

            const csv = convertToCSV(data)
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `FECU_${MONTHS[parseInt(month)]}_${year}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success("Reporte descargado correctamente")
            setOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al generar el reporte")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar FECU
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generar Reporte FECU</DialogTitle>
                    <DialogDescription>
                        Seleccione el período para generar el archivo CSV con formato regulatorio.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mes</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Año</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleDownload} disabled={isPending}>
                        {isPending ? "Generando..." : "Descargar CSV"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
