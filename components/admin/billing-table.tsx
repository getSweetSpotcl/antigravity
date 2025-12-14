"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createBillingRecord, markAsPaid, generateBillingForTenant } from "@/actions/admin-billing"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, CheckCircle, Zap, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface BillingTableProps {
    records: any[]
    tenantId: string
}

export function BillingTable({ records, tenantId }: BillingTableProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [generating, setGenerating] = useState(false)

    const handleGenerateAuto = async () => {
        setGenerating(true)
        try {
            const result = await generateBillingForTenant(tenantId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success || "Cobro generado exitosamente")
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al generar el cobro")
        } finally {
            setGenerating(false)
        }
    }

    const handleCreate = async () => {
        if (!amount) return

        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 5) // 5 días para pagar por defecto

        const result = await createBillingRecord({
            tenantId,
            amount: parseInt(amount),
            dueDate,
            description
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Cobro generado")
            setOpen(false)
            setAmount("")
            setDescription("")
        }
    }

    const handlePay = async (id: string) => {
        const result = await markAsPaid(id, tenantId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Marcado como pagado")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Historial de Pagos</h3>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateAuto}
                        disabled={generating}
                    >
                        {generating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="mr-2 h-4 w-4" />
                        )}
                        Generar Cobro Mensual
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Cobro Manual
                            </Button>
                        </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generar Cobro Manual</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Monto (CLP)</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Mensualidad Pro..."
                                />
                            </div>
                            <Button onClick={handleCreate} className="w-full">Generar</Button>
                        </div>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha Emisión</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Pago</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay registros de facturación
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        {format(new Date(record.issueDate), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>{record.description || "Suscripción Mensual"}</TableCell>
                                    <TableCell>${record.amount.toLocaleString("es-CL")}</TableCell>
                                    <TableCell>
                                        <Badge variant={record.status === "PAID" ? "default" : "destructive"}>
                                            {record.status === "PAID" ? "Pagado" : "Pendiente"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {record.paidAt
                                            ? format(new Date(record.paidAt), "dd MMM yyyy", { locale: es })
                                            : "-"
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {record.status !== "PAID" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePay(record.id)}
                                                title="Marcar como pagado"
                                            >
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
