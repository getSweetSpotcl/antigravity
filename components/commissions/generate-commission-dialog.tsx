"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { GenerateCommissionSchema, GenerateCommissionFormValues } from "@/schemas/commission"
import { generateCommissionsFromPolicy } from "@/actions/commission"
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
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
import { CalendarIcon, Plus } from "lucide-react"
import { toast } from "sonner"

interface PolicyForCommission {
    id: string
    number: string
    premium: number | string
    currency: string
    commission: number | string
    Client: {
        firstName: string
        lastName: string
    }
}

interface GenerateCommissionDialogProps {
    policies: PolicyForCommission[]
}

export function GenerateCommissionDialog({ policies }: GenerateCommissionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyForCommission | null>(null)

    const form = useForm<GenerateCommissionFormValues>({
        resolver: zodResolver(GenerateCommissionSchema),
        defaultValues: {
            policyId: "",
            percentage: "",
            installments: 1,
        },
    })

    const onPolicyChange = (policyId: string) => {
        const policy = policies.find((p) => p.id === policyId)
        setSelectedPolicy(policy || null)
        form.setValue("policyId", policyId)
        if (policy) {
            // Pre-llenar con el porcentaje de comisión de la póliza si está disponible
            const premium = Number(policy.premium)
            const commission = Number(policy.commission)
            if (premium > 0 && commission > 0) {
                const percentage = (commission / premium) * 100
                form.setValue("percentage", percentage.toFixed(2))
            }
        }
    }

    const onSubmit = async (values: GenerateCommissionFormValues) => {
        setIsPending(true)
        try {
            const result = await generateCommissionsFromPolicy(values)
            if (result.success) {
                toast.success(result.success)
                setOpen(false)
                form.reset()
                setSelectedPolicy(null)
            } else {
                toast.error(result.error || "Error al generar comisiones")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    const percentage = parseFloat(form.watch("percentage") || "0")
    const installments = form.watch("installments") || 1
    const calculatedCommission = selectedPolicy
        ? (Number(selectedPolicy.premium) * percentage) / 100
        : 0
    const perInstallment = calculatedCommission / installments

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Generar Comisión
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generar Comisiones</DialogTitle>
                    <DialogDescription>
                        Genera comisiones automáticamente a partir de una póliza.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="policyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Póliza</FormLabel>
                                    <Select
                                        onValueChange={(value) => onPolicyChange(value)}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione póliza" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {policies.map((policy) => (
                                                <SelectItem key={policy.id} value={policy.id}>
                                                    {policy.number} - {policy.Client.firstName}{" "}
                                                    {policy.Client.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedPolicy && (
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Prima Total:</span>
                                    <span className="font-medium">
                                        {Number(selectedPolicy.premium).toLocaleString("es-CL", {
                                            minimumFractionDigits: 2,
                                        })}{" "}
                                        {selectedPolicy.currency}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Comisión Póliza:</span>
                                    <span className="font-medium">
                                        {Number(selectedPolicy.commission).toLocaleString("es-CL", {
                                            minimumFractionDigits: 2,
                                        })}{" "}
                                        {selectedPolicy.currency}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="percentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Porcentaje (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                placeholder="Ej: 15.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="installments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cuotas</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Cuotas" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 6, 12].map((n) => (
                                                    <SelectItem key={n} value={n.toString()}>
                                                        {n} {n === 1 ? "cuota" : "cuotas"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha Vencimiento Primera Cuota</FormLabel>
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
                                                        format(field.value, "PPP", { locale: es })
                                                    ) : (
                                                        <span>Opcional (usa fecha inicio póliza)</span>
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
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription className="text-xs">
                                        Las siguientes cuotas vencerán mensualmente
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedPolicy && percentage > 0 && (
                            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
                                <p className="text-sm font-medium text-green-800">Resumen de Comisiones</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-700">Total a generar:</span>
                                    <span className="font-bold text-green-800">
                                        {calculatedCommission.toLocaleString("es-CL", {
                                            minimumFractionDigits: 2,
                                        })}{" "}
                                        {selectedPolicy.currency}
                                    </span>
                                </div>
                                {installments > 1 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-700">Por cuota ({installments}):</span>
                                        <span className="font-medium text-green-800">
                                            {perInstallment.toLocaleString("es-CL", {
                                                minimumFractionDigits: 2,
                                            })}{" "}
                                            {selectedPolicy.currency}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending || !selectedPolicy}>
                                {isPending ? "Generando..." : "Generar Comisiones"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
