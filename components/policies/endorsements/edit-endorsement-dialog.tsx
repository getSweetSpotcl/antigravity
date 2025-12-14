"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Endorsement } from "@prisma/client"
import { UpdateEndorsementSchema, UpdateEndorsementFormValues } from "@/schemas/endorsement"
import { updateEndorsement } from "@/actions/endorsement"
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
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

interface EditEndorsementDialogProps {
    endorsement: Endorsement
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditEndorsementDialog({ endorsement, open, onOpenChange }: EditEndorsementDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<UpdateEndorsementFormValues>({
        resolver: zodResolver(UpdateEndorsementSchema),
        defaultValues: {
            type: endorsement.type,
            description: endorsement.description,
            date: new Date(endorsement.date),
            number: endorsement.number || "",
            notes: endorsement.notes || "",
        },
    })

    // Reset form when endorsement changes
    useEffect(() => {
        form.reset({
            type: endorsement.type,
            description: endorsement.description,
            date: new Date(endorsement.date),
            number: endorsement.number || "",
            notes: endorsement.notes || "",
        })
    }, [endorsement, form])

    const onSubmit = async (values: UpdateEndorsementFormValues) => {
        setIsPending(true)
        try {
            const result = await updateEndorsement(endorsement.id, values)
            if (result.success) {
                toast.success(result.success)
                onOpenChange(false)
            } else {
                toast.error(result.error || "Error al actualizar endoso")
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
                    <DialogTitle>Editar Endoso</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del endoso. Los cambios de prima no se pueden editar directamente.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Endoso</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="GENERAL_MODIFICATION">Modificación General</SelectItem>
                                            <SelectItem value="RENEWAL">Renovación</SelectItem>
                                            <SelectItem value="CANCELLATION">Cancelación</SelectItem>
                                            <SelectItem value="INCLUSION">Inclusión</SelectItem>
                                            <SelectItem value="EXCLUSION">Exclusión</SelectItem>
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
                                    <FormLabel>Fecha del Endoso</FormLabel>
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
                                                        format(field.value, "PPP")
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
                                    <FormLabel>Número de Endoso</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: END-001" {...field} value={field.value || ""} />
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
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalle de la modificación..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
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
                                    <FormLabel>Notas Internas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Notas adicionales..."
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {endorsement.premiumChange && (
                            <div className="rounded-lg bg-muted p-3">
                                <p className="text-sm text-muted-foreground">
                                    Cambio de prima registrado:{" "}
                                    <span className={Number(endorsement.premiumChange) >= 0 ? "text-green-600" : "text-red-600"}>
                                        {Number(endorsement.premiumChange) >= 0 ? "+" : ""}
                                        {Number(endorsement.premiumChange).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                                    </span>
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
