"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Commission, Policy, Client, InsuranceCompany, CommissionPayment } from "@prisma/client"
import { CommissionPaymentSchema, CommissionPaymentFormValues } from "@/schemas/commission"
import { registerCommissionPayment } from "@/actions/commission"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, DollarSign } from "lucide-react"
import { toast } from "sonner"

type CommissionWithRelations = Commission & {
    Policy: Policy & {
        Client: Client
        InsuranceCompany: InsuranceCompany | null
    }
    CommissionPayment: CommissionPayment[]
}

interface RegisterPaymentDialogProps {
    commission: CommissionWithRelations
    open: boolean
    onOpenChange: (open: boolean) => void
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    TRANSFER: "Transferencia",
    CHECK: "Cheque",
    CASH: "Efectivo",
    CREDIT_CARD: "Tarjeta de Crédito",
    OTHER: "Otro",
}

export function RegisterPaymentDialog({ commission, open, onOpenChange }: RegisterPaymentDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const pendingAmount = Number(commission.pendingAmount)

    const form = useForm<CommissionPaymentFormValues>({
        resolver: zodResolver(CommissionPaymentSchema),
        defaultValues: {
            commissionId: commission.id,
            amount: pendingAmount.toString(),
            currency: commission.currency as "UF" | "CLP" | "USD",
            paymentMethod: "TRANSFER",
            reference: "",
            bankName: "",
            accountNumber: "",
            notes: "",
        },
    })

    const onSubmit = async (values: CommissionPaymentFormValues) => {
        setIsPending(true)
        try {
            const result = await registerCommissionPayment(values)
            if (result.success) {
                toast.success(result.success)
                onOpenChange(false)
                form.reset()
            } else {
                toast.error(result.error || "Error al registrar pago")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    const selectedMethod = form.watch("paymentMethod")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Registrar Pago de Comisión
                    </DialogTitle>
                    <DialogDescription>
                        Póliza {commission.Policy.number} -{" "}
                        {commission.Policy.Client.firstName} {commission.Policy.Client.lastName}
                    </DialogDescription>
                </DialogHeader>

                {/* Info de la comisión */}
                <div className="rounded-lg bg-muted p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monto Total:</span>
                        <span className="font-medium">
                            {Number(commission.amount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ya Pagado:</span>
                        <span className="font-medium text-green-600">
                            {Number(commission.paidAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-muted-foreground">Pendiente:</span>
                        <span className="font-bold text-orange-600">
                            {pendingAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto del Pago</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                max={pendingAmount}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Máximo: {pendingAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Pago</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy")
                                                        ) : (
                                                            <span>Seleccione</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Método de Pago</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione método" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {(selectedMethod === "TRANSFER" || selectedMethod === "CHECK") && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="reference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {selectedMethod === "TRANSFER"
                                                    ? "N° Transferencia"
                                                    : "N° Cheque"}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={
                                                        selectedMethod === "TRANSFER"
                                                            ? "Ej: 12345678"
                                                            : "Ej: 0001234"
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Banco</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Banco Estado" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observaciones adicionales..."
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Registrando..." : "Registrar Pago"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
