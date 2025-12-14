"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createPlan, updatePlan } from "@/actions/admin-plans"
import { toast } from "sonner"
import { Plus, Pencil } from "lucide-react"

const PlanSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
    maxUsers: z.coerce.number().min(1, "Mínimo 1 usuario"),
    maxStorage: z.coerce.number().min(1, "Mínimo 1 GB"),
    isActive: z.boolean().default(true),
})

interface PlanDialogProps {
    plan?: any
    trigger?: React.ReactNode
}

export function PlanDialog({ plan, trigger }: PlanDialogProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!plan

    const form = useForm<any>({
        resolver: zodResolver(PlanSchema),
        defaultValues: {
            name: plan?.name || "",
            description: plan?.description || "",
            price: plan?.price || 0,
            maxUsers: plan?.maxUsers || 5,
            maxStorage: plan ? Number(plan.maxStorage) / (1024 * 1024 * 1024) : 1,
            isActive: plan?.isActive ?? true,
        },
    })

    const onSubmit = async (values: z.infer<typeof PlanSchema>) => {
        try {
            if (isEditing) {
                const result = await updatePlan(plan.id, values)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Plan actualizado")
                    setOpen(false)
                }
            } else {
                const result = await createPlan(values)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Plan creado")
                    setOpen(false)
                    form.reset()
                }
            }
        } catch (error) {
            toast.error("Error al guardar el plan")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Plan
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Plan" : "Crear Nuevo Plan"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Plan</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: Básico" />
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
                                        <Textarea {...field} placeholder="Descripción corta..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio (CLP)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxUsers"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Usuarios Máx.</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="maxStorage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Almacenamiento (GB)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {isEditing && (
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                                            <div className="space-y-0.5">
                                                <FormLabel>Activo</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Guardar</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
