"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import type { CommissionStatus } from "@prisma/client"
import {
    registerAgentCommissionPaymentSchema,
    type RegisterAgentCommissionPaymentInput,
} from "@/schemas/agent-commission"
import { registerAgentCommissionPayment } from "@/actions/agent-commission"
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
import { CalendarIcon, DollarSign, User } from "lucide-react"
import { toast } from "sonner"

interface AgentCommissionForPayment {
    id: string
    agentId: string
    amount: number | string
    pendingAmount: number | string
    currency: string
    status: CommissionStatus
    Agent: {
        id: string
        name: string | null
        email: string
        bankName?: string | null
        bankAccountNumber?: string | null
        bankAccountType?: string | null
    }
    Policy: {
        number: string
        Client: {
            firstName: string
            lastName: string
        }
    }
}

interface RegisterAgentPaymentDialogProps {
    commission: AgentCommissionForPayment
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

export function RegisterAgentPaymentDialog({
    commission,
    open,
    onOpenChange,
}: RegisterAgentPaymentDialogProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const pendingAmount = Number(commission.pendingAmount)

    const form = useForm<RegisterAgentCommissionPaymentInput>({
        resolver: zodResolver(registerAgentCommissionPaymentSchema),
        defaultValues: {
            agentCommissionId: commission.id,
            amount: pendingAmount,
            currency: commission.currency,
            paymentDate: new Date(),
            paymentMethod: "TRANSFER",
            reference: "",
            bankName: commission.Agent.bankName || "",
            accountNumber: commission.Agent.bankAccountNumber || "",
            notes: "",
        },
    })

    const onSubmit = async (values: RegisterAgentCommissionPaymentInput) => {
        setIsPending(true)
        try {
            const result = await registerAgentCommissionPayment(values)
            if (result.success) {
                toast.success(result.success)
                onOpenChange(false)
                form.reset()
                router.refresh()
            } else {
                toast.error(result.error || "Error al registrar pago")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Registrar Pago a Vendedor
                    </DialogTitle>
                    <DialogDescription>
                        Registra un pago de comisión al vendedor.
                    </DialogDescription>
                </DialogHeader>

                {/* Info del vendedor y comisión */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                            {commission.Agent.name || commission.Agent.email}
                        </span>
                    </div>
                    <div className="text-sm text-slate-600">
                        Póliza: {commission.Policy.number} - {commission.Policy.Client.firstName} {commission.Policy.Client.lastName}
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Monto pendiente:</span>
                        <span className="font-medium text-amber-600">
                            {pendingAmount.toFixed(2)} {commission.currency}
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
                                        <FormLabel>Monto</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                max={pendingAmount}
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Máx: {pendingAmount.toFixed(2)}
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
                                                        variant="outline"
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
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
                                                    locale={es}
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                        <div className="grid grid-cols-2 gap-4">
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
                            <FormField
                                control={form.control}
                                name="accountNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>N° Cuenta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Número de cuenta" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Referencia / N° Operación</FormLabel>
                                    <FormControl>
                                        <Input placeholder="N° de transferencia o cheque" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observaciones adicionales..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
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
