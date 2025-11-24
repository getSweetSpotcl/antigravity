"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClaimSchema, ClaimFormValues } from "@/schemas/claim"
import { createClaim } from "@/actions/claim"
// @ts-ignore
import { Policy, Client } from "@prisma/client"
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface CreateClaimDialogProps {
    policies: (Policy & { client: Client })[]
}

export function CreateClaimDialog({ policies }: CreateClaimDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ClaimFormValues>({
        resolver: zodResolver(ClaimSchema),
        defaultValues: {
            policyId: "",
            description: "",
            number: "",
        },
    })

    const onSubmit = async (values: ClaimFormValues) => {
        setIsPending(true)
        try {
            const result = await createClaim(values)
            if (result.success) {
                toast.success("Siniestro reportado correctamente")
                setOpen(false)
                form.reset()
                window.location.reload()
            } else {
                toast.error(result.error || "Error al reportar siniestro")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reportar Siniestro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reportar Nuevo Siniestro</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del siniestro a reportar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="policyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Póliza Afectada</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione póliza" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {policies.map((policy) => (
                                                <SelectItem key={policy.id} value={policy.id}>
                                                    {policy.number} - {policy.client.firstName}{" "}
                                                    {policy.client.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha del Siniestro</FormLabel>
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
                                                        <span>Seleccione fecha</span>
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
                        <FormField
                            control={form.control}
                            name="number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Siniestro (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: SIN-2025-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción del Siniestro</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describa los detalles del siniestro..."
                                            className="resize-none min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Reportando..." : "Reportar Siniestro"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
